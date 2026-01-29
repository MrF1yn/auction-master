// WebSocket connection hook with authentication and time synchronization

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuctionStore from 'store/auctionStore';
import useAuth from './useAuth';

// Socket events
const EVENTS = {
  BID_UPDATE: 'BID_UPDATE_BROADCAST',
  AUCTION_ENDED: 'auction:ended',
  AUCTION_CREATED: 'auction:created',
  TIME_SYNC_REQUEST: 'TIME_SYNC_REQUEST',
  TIME_SYNC_RESPONSE: 'TIME_SYNC_RESPONSE',
  JOIN_ROOM: 'JOIN_AUCTION_ROOM',
  LEAVE_ROOM: 'LEAVE_AUCTION_ROOM'
} as const;

const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL || 'http://localhost:3010';
const TIME_SYNC_INTERVAL = 30000;
const SYNC_SAMPLES_COUNT = 5;

interface TimeSyncSample {
  offsetInMs: number;
  roundTripTimeInMs: number;
}

export function useSocketConnection() {
  const socketRef = useRef<Socket | null>(null);
  const timeSyncSamplesRef = useRef<TimeSyncSample[]>([]);
  const timeSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoggedIn } = useAuth();
  const {
    updateSocketConnectionState,
    updateTimeSyncState,
    updateAuctionItemWithBid,
    markAuctionAsEnded,
    markAuctionAsRecentlyUpdated,
    addNewAuctionItem
  } = useAuctionStore();

  // Time sync using NTP-style algorithm
  const performTimeSyncRequest = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit(EVENTS.TIME_SYNC_REQUEST, { clientTimestampT0InMs: Date.now() });
  }, []);

  const handleTimeSyncResponse = useCallback(
    (response: { clientTimestampT0InMs: number; serverTimestampT1InMs: number; serverTimestampT2InMs: number }) => {
      const clientTimestampT3InMs = Date.now();
      const { clientTimestampT0InMs, serverTimestampT1InMs, serverTimestampT2InMs } = response;

      const offsetInMs = (serverTimestampT1InMs - clientTimestampT0InMs + (serverTimestampT2InMs - clientTimestampT3InMs)) / 2;
      const roundTripTimeInMs = clientTimestampT3InMs - clientTimestampT0InMs - (serverTimestampT2InMs - serverTimestampT1InMs);

      timeSyncSamplesRef.current.push({ offsetInMs, roundTripTimeInMs });

      if (timeSyncSamplesRef.current.length >= SYNC_SAMPLES_COUNT) {
        const sortedSamples = [...timeSyncSamplesRef.current].sort((a, b) => a.roundTripTimeInMs - b.roundTripTimeInMs);
        const medianSample = sortedSamples[Math.floor(sortedSamples.length / 2)];

        updateTimeSyncState({
          serverTimeOffsetInMs: medianSample.offsetInMs,
          lastSyncTimestamp: Date.now(),
          isTimeSynced: true,
          roundTripTimeInMs: medianSample.roundTripTimeInMs
        });

        timeSyncSamplesRef.current = [];
      }
    },
    [updateTimeSyncState]
  );

  const handleBidUpdate = useCallback(
    (bidUpdate: {
      auctionItemId: string;
      newHighestBidInDollars: number;
      highestBidderUserId: string;
      highestBidderUsername: string;
      bidPlacedAtTimestamp: string;
      totalNumberOfBids: number;
    }) => {
      updateAuctionItemWithBid(bidUpdate);
      markAuctionAsRecentlyUpdated(bidUpdate.auctionItemId);
      setTimeout(() => useAuctionStore.getState().clearRecentlyUpdatedFlag(bidUpdate.auctionItemId), 500);
    },
    [updateAuctionItemWithBid, markAuctionAsRecentlyUpdated]
  );

  const handleAuctionEnded = useCallback(
    (notification: { auctionItemId: string; winnerUserId: string | null; winnerUsername: string | null }) => {
      markAuctionAsEnded(notification.auctionItemId, notification.winnerUserId, notification.winnerUsername);
    },
    [markAuctionAsEnded]
  );

  const handleNewAuctionCreated = useCallback(
    (data: { auctionItem: any }) => {
      if (data.auctionItem) {
        // Transform backend response to frontend format
        const item = {
          id: data.auctionItem.id,
          itemTitle: data.auctionItem.itemTitle,
          itemDescription: data.auctionItem.itemDescription,
          startingPriceInDollars: data.auctionItem.startingPriceInDollars,
          currentHighestBidInDollars: data.auctionItem.currentHighestBidInDollars,
          minimumBidIncrementInDollars: data.auctionItem.minimumBidIncrementInDollars,
          auctionStartTimeTimestamp: data.auctionItem.auctionStartTimeTimestamp,
          auctionEndTimeTimestamp: data.auctionItem.auctionEndTimeTimestamp,
          itemImageUrl: data.auctionItem.itemImageUrl,
          currentStatus: data.auctionItem.currentStatus,
          creatorUser: data.auctionItem.creatorUser,
          winnerUser: data.auctionItem.winnerUser || null,
          totalBidCount: data.auctionItem.totalBidCount || 0,
          highestBidder: data.auctionItem.highestBidder || null
        };
        addNewAuctionItem(item);
      }
    },
    [addNewAuctionItem]
  );

  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('serviceToken');
    if (!token || !isLoggedIn) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      updateSocketConnectionState({ isConnected: true, connectionError: null, reconnectAttempts: 0 });

      if (timeSyncIntervalRef.current) clearInterval(timeSyncIntervalRef.current);

      // Initial time sync
      for (let i = 0; i < SYNC_SAMPLES_COUNT; i++) {
        setTimeout(performTimeSyncRequest, i * 200);
      }

      // Periodic time sync
      timeSyncIntervalRef.current = setInterval(() => {
        for (let i = 0; i < SYNC_SAMPLES_COUNT; i++) {
          setTimeout(performTimeSyncRequest, i * 200);
        }
      }, TIME_SYNC_INTERVAL);
    });

    socket.on('disconnect', (reason) => {
      updateSocketConnectionState({ isConnected: false, connectionError: `Disconnected: ${reason}` });
      if (timeSyncIntervalRef.current) clearInterval(timeSyncIntervalRef.current);
    });

    socket.on('connect_error', (error) => {
      updateSocketConnectionState({ isConnected: false, connectionError: error.message });
    });

    socket.on(EVENTS.TIME_SYNC_RESPONSE, handleTimeSyncResponse);
    socket.on(EVENTS.BID_UPDATE, handleBidUpdate);
    socket.on(EVENTS.AUCTION_ENDED, handleAuctionEnded);
    socket.on(EVENTS.AUCTION_CREATED, handleNewAuctionCreated);
  }, [
    isLoggedIn,
    updateSocketConnectionState,
    performTimeSyncRequest,
    handleTimeSyncResponse,
    handleBidUpdate,
    handleAuctionEnded,
    handleNewAuctionCreated
  ]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (timeSyncIntervalRef.current) {
      clearInterval(timeSyncIntervalRef.current);
      timeSyncIntervalRef.current = null;
    }

    updateSocketConnectionState({ isConnected: false, connectionError: null, reconnectAttempts: 0 });
    updateTimeSyncState({ isTimeSynced: false });
  }, [updateSocketConnectionState, updateTimeSyncState]);

  const joinAuctionRoom = useCallback((auctionItemId: string) => {
    socketRef.current?.connected && socketRef.current.emit(EVENTS.JOIN_ROOM, { auctionItemId });
  }, []);

  const leaveAuctionRoom = useCallback((auctionItemId: string) => {
    socketRef.current?.connected && socketRef.current.emit(EVENTS.LEAVE_ROOM, { auctionItemId });
  }, []);

  const getSocketInstance = useCallback(() => socketRef.current, []);

  useEffect(() => {
    if (isLoggedIn) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isLoggedIn, connectSocket, disconnectSocket]);

  return {
    connectSocket,
    disconnectSocket,
    joinAuctionRoom,
    leaveAuctionRoom,
    getSocketInstance
  };
}

export default useSocketConnection;
