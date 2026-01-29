// Real-time bidding events via WebSocket

import { Server, Socket } from "socket.io";
import {
  SOCKET_EVENT_CLIENT_JOIN_AUCTION_ROOM,
  SOCKET_EVENT_CLIENT_LEAVE_AUCTION_ROOM,
  SOCKET_EVENT_CLIENT_PLACE_BID,
  SOCKET_EVENT_SERVER_BID_UPDATE_BROADCAST,
  SOCKET_EVENT_SERVER_BID_PLACED_SUCCESS,
  SOCKET_EVENT_SERVER_BID_PLACED_ERROR,
  SOCKET_EVENT_SERVER_JOINED_AUCTION_ROOM,
  SOCKET_EVENT_SERVER_LEFT_AUCTION_ROOM,
  SOCKET_EVENT_SERVER_AUCTION_STATE_SYNC,
  JoinAuctionRoomPayload,
  LeaveAuctionRoomPayload,
  PlaceBidPayload,
  BidUpdateBroadcastPayload,
  BidPlacedSuccessPayload,
  BidPlacedErrorPayload,
  AuctionStateSyncPayload,
} from "../constants/socket-events.constants";
import { generateAuctionRoomNameFromId } from "../config/socket-io.config";
import {
  processBidWithDistributedLock,
  fetchCurrentAuctionBidInfo,
} from "../services/bid-processor.service";
import { getUserDataFromSocket } from "./authentication.socket";
import { logSocketEvent, logErrorMessage } from "../utils/logger.util";

let ioServer: Server | null = null;

export function setSocketIoServerInstance(server: Server): void {
  ioServer = server;
}

export function getSocketIoServerInstance(): Server | null {
  return ioServer;
}

export function registerBidEventHandlers(socket: Socket): void {
  socket.on(
    SOCKET_EVENT_CLIENT_JOIN_AUCTION_ROOM,
    (payload: JoinAuctionRoomPayload) => handleJoinRoom(socket, payload),
  );
  socket.on(
    SOCKET_EVENT_CLIENT_LEAVE_AUCTION_ROOM,
    (payload: LeaveAuctionRoomPayload) => handleLeaveRoom(socket, payload),
  );
  socket.on(SOCKET_EVENT_CLIENT_PLACE_BID, (payload: PlaceBidPayload) =>
    handlePlaceBid(socket, payload),
  );
}

async function handleJoinRoom(
  socket: Socket,
  payload: JoinAuctionRoomPayload,
): Promise<void> {
  const userData = getUserDataFromSocket(socket);
  const { auctionItemId } = payload;

  if (!auctionItemId) return;

  const roomName = generateAuctionRoomNameFromId(auctionItemId);
  await socket.join(roomName);

  logSocketEvent("JOIN_ROOM", socket.id, userData?.userId, {
    auctionItemId,
    roomName,
  });
  socket.emit(SOCKET_EVENT_SERVER_JOINED_AUCTION_ROOM, { auctionItemId });

  const bidInfo = await fetchCurrentAuctionBidInfo(auctionItemId);
  if (bidInfo) {
    const syncPayload: AuctionStateSyncPayload = {
      auctionItemId: bidInfo.auctionItemId,
      currentHighestBidInDollars: bidInfo.currentHighestBidInDollars,
      highestBidderUserId: bidInfo.highestBidderUserId,
      highestBidderUsername: bidInfo.highestBidderUsername,
      auctionEndTimeTimestamp: bidInfo.auctionEndTimeTimestamp.toISOString(),
      currentStatus: "ACTIVE",
      totalNumberOfBids: bidInfo.totalNumberOfBids,
    };
    socket.emit(SOCKET_EVENT_SERVER_AUCTION_STATE_SYNC, syncPayload);
  }
}

async function handleLeaveRoom(
  socket: Socket,
  payload: LeaveAuctionRoomPayload,
): Promise<void> {
  const userData = getUserDataFromSocket(socket);
  const { auctionItemId } = payload;

  if (!auctionItemId) return;

  const roomName = generateAuctionRoomNameFromId(auctionItemId);
  await socket.leave(roomName);

  logSocketEvent("LEAVE_ROOM", socket.id, userData?.userId, {
    auctionItemId,
    roomName,
  });
  socket.emit(SOCKET_EVENT_SERVER_LEFT_AUCTION_ROOM, { auctionItemId });
}

async function handlePlaceBid(
  socket: Socket,
  payload: PlaceBidPayload,
): Promise<void> {
  const userData = getUserDataFromSocket(socket);

  if (!userData) {
    socket.emit(SOCKET_EVENT_SERVER_BID_PLACED_ERROR, {
      auctionItemId: payload.auctionItemId,
      errorCode: "AUTH_ERROR",
      errorMessage: "Not authenticated",
    } as BidPlacedErrorPayload);
    return;
  }

  const { auctionItemId, bidAmountInDollars } = payload;

  if (
    !auctionItemId ||
    typeof bidAmountInDollars !== "number" ||
    bidAmountInDollars <= 0
  ) {
    socket.emit(SOCKET_EVENT_SERVER_BID_PLACED_ERROR, {
      auctionItemId,
      errorCode: "VALIDATION_ERROR",
      errorMessage: "Invalid bid data",
    } as BidPlacedErrorPayload);
    return;
  }

  logSocketEvent("BID_ATTEMPT", socket.id, userData.userId, {
    auctionItemId,
    bidAmountInDollars,
  });

  try {
    const result = await processBidWithDistributedLock(
      auctionItemId,
      userData.userId,
      bidAmountInDollars,
    );

    if (result.wasBidSuccessful) {
      const successPayload: BidPlacedSuccessPayload = {
        auctionItemId,
        bidAmountInDollars,
        bidId: result.bidId!,
        bidPlacedAtTimestamp: result.bidPlacedAtTimestamp!.toISOString(),
      };
      socket.emit(SOCKET_EVENT_SERVER_BID_PLACED_SUCCESS, successPayload);

      const roomName = generateAuctionRoomNameFromId(auctionItemId);
      const bidInfo = await fetchCurrentAuctionBidInfo(auctionItemId);

      const broadcastPayload: BidUpdateBroadcastPayload = {
        auctionItemId,
        newHighestBidInDollars: result.newHighestBidInDollars!,
        highestBidderUserId: userData.userId,
        highestBidderUsername: userData.username,
        bidPlacedAtTimestamp: result.bidPlacedAtTimestamp!.toISOString(),
        totalNumberOfBids: bidInfo?.totalNumberOfBids || 1,
      };

      ioServer
        ?.to(roomName)
        .emit(SOCKET_EVENT_SERVER_BID_UPDATE_BROADCAST, broadcastPayload);

      logSocketEvent("BID_SUCCESS", socket.id, userData.userId, {
        auctionItemId,
        bidAmount: bidAmountInDollars,
        processingTimeMs: result.processingTimeInMs,
      });
    } else {
      socket.emit(SOCKET_EVENT_SERVER_BID_PLACED_ERROR, {
        auctionItemId,
        errorCode: result.errorCode || "BID_FAILED",
        errorMessage: result.errorMessage || "Bid failed",
      } as BidPlacedErrorPayload);

      logSocketEvent("BID_FAILED", socket.id, userData.userId, {
        auctionItemId,
        errorCode: result.errorCode,
      });
    }
  } catch (error) {
    logErrorMessage("Bid processing error", error, {
      socketId: socket.id,
      userId: userData.userId,
      auctionItemId,
    });
    socket.emit(SOCKET_EVENT_SERVER_BID_PLACED_ERROR, {
      auctionItemId,
      errorCode: "SERVER_ERROR",
      errorMessage: "An error occurred while processing your bid",
    } as BidPlacedErrorPayload);
  }
}

export function broadcastAuctionEnded(
  auctionItemId: string,
  winnerUserId: string | null,
  winnerUsername: string | null,
  finalBidAmountInDollars: number,
): void {
  if (!ioServer) return;

  const roomName = generateAuctionRoomNameFromId(auctionItemId);
  ioServer.to(roomName).emit("AUCTION_ENDED_NOTIFICATION", {
    auctionItemId,
    winnerUserId,
    winnerUsername,
    finalBidAmountInDollars,
    auctionEndedAtTimestamp: new Date().toISOString(),
  });
}

// Broadcast new auction to all connected clients
export function broadcastNewAuction(auctionItem: any): void {
  if (!ioServer) return;
  ioServer.emit("auction:created", { auctionItem });
}
