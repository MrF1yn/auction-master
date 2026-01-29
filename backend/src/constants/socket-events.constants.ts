// ==============================|| SOCKET EVENTS CONSTANTS ||============================== //
// Defines all WebSocket event names for client-server communication

// ==============================|| CLIENT TO SERVER EVENTS ||============================== //
// Events emitted from client to server

export const SOCKET_EVENT_CLIENT_TIME_SYNC_REQUEST = 'TIME_SYNC_REQUEST';
export const SOCKET_EVENT_CLIENT_JOIN_AUCTION_ROOM = 'JOIN_AUCTION_ROOM';
export const SOCKET_EVENT_CLIENT_LEAVE_AUCTION_ROOM = 'LEAVE_AUCTION_ROOM';
export const SOCKET_EVENT_CLIENT_PLACE_BID = 'PLACE_BID';

// ==============================|| SERVER TO CLIENT EVENTS ||============================== //
// Events emitted from server to client

export const SOCKET_EVENT_SERVER_TIME_SYNC_RESPONSE = 'TIME_SYNC_RESPONSE';
export const SOCKET_EVENT_SERVER_BID_UPDATE_BROADCAST = 'BID_UPDATE_BROADCAST';
export const SOCKET_EVENT_SERVER_AUCTION_ENDED_NOTIFICATION = 'AUCTION_ENDED_NOTIFICATION';
export const SOCKET_EVENT_SERVER_BID_PLACED_SUCCESS = 'BID_PLACED_SUCCESS';
export const SOCKET_EVENT_SERVER_BID_PLACED_ERROR = 'BID_PLACED_ERROR';
export const SOCKET_EVENT_SERVER_JOINED_AUCTION_ROOM = 'JOINED_AUCTION_ROOM';
export const SOCKET_EVENT_SERVER_LEFT_AUCTION_ROOM = 'LEFT_AUCTION_ROOM';
export const SOCKET_EVENT_SERVER_CONNECTION_ERROR = 'CONNECTION_ERROR';
export const SOCKET_EVENT_SERVER_AUCTION_STATE_SYNC = 'AUCTION_STATE_SYNC';

// ==============================|| BUILT-IN SOCKET.IO EVENTS ||============================== //
// Standard Socket.IO events

export const SOCKET_EVENT_CONNECT = 'connect';
export const SOCKET_EVENT_DISCONNECT = 'disconnect';
export const SOCKET_EVENT_ERROR = 'error';
export const SOCKET_EVENT_CONNECT_ERROR = 'connect_error';

// ==============================|| EVENT PAYLOAD INTERFACES ||============================== //
// TypeScript interfaces for event payloads

export interface TimeSyncRequestPayload {
  clientTimestampT0InMs: number;
}

export interface TimeSyncResponsePayload {
  clientTimestampT0InMs: number;
  serverTimestampT1InMs: number;
  serverTimestampT2InMs: number;
}

export interface JoinAuctionRoomPayload {
  auctionItemId: string;
}

export interface LeaveAuctionRoomPayload {
  auctionItemId: string;
}

export interface PlaceBidPayload {
  auctionItemId: string;
  bidAmountInDollars: number;
}

export interface BidUpdateBroadcastPayload {
  auctionItemId: string;
  newHighestBidInDollars: number;
  highestBidderUserId: string;
  highestBidderUsername: string;
  bidPlacedAtTimestamp: string;
  totalNumberOfBids: number;
}

export interface AuctionEndedNotificationPayload {
  auctionItemId: string;
  winnerUserId: string | null;
  winnerUsername: string | null;
  finalBidAmountInDollars: number;
  auctionEndedAtTimestamp: string;
}

export interface BidPlacedSuccessPayload {
  auctionItemId: string;
  bidAmountInDollars: number;
  bidId: string;
  bidPlacedAtTimestamp: string;
}

export interface BidPlacedErrorPayload {
  auctionItemId: string;
  errorCode: string;
  errorMessage: string;
}

export interface AuctionStateSyncPayload {
  auctionItemId: string;
  currentHighestBidInDollars: number;
  highestBidderUserId: string | null;
  highestBidderUsername: string | null;
  auctionEndTimeTimestamp: string;
  currentStatus: string;
  totalNumberOfBids: number;
}
