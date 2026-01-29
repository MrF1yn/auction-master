// Global state for auction items, real-time bidding, and time synchronization

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface AuctionItemState {
  id: string;
  itemTitle: string;
  itemDescription: string;
  startingPriceInDollars: number;
  currentHighestBidInDollars: number;
  minimumBidIncrementInDollars: number;
  auctionStartTimeTimestamp: string;
  auctionEndTimeTimestamp: string;
  itemImageUrl: string | null;
  currentStatus: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  creatorUser: { userId: string; username: string; fullName: string };
  winnerUser: { userId: string; username: string; fullName: string } | null;
  totalBidCount: number;
  highestBidder: { userId: string; username: string } | null;
}

export interface BidUpdatePayload {
  auctionItemId: string;
  newHighestBidInDollars: number;
  highestBidderUserId: string;
  highestBidderUsername: string;
  bidPlacedAtTimestamp: string;
  totalNumberOfBids: number;
}

export interface TimeSyncState {
  serverTimeOffsetInMs: number;
  lastSyncTimestamp: number;
  isTimeSynced: boolean;
  roundTripTimeInMs: number;
}

export interface SocketConnectionState {
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
}

interface AuctionStoreState {
  allAuctionItems: AuctionItemState[];
  isLoadingAuctionItems: boolean;
  auctionItemsLoadError: string | null;
  timeSyncState: TimeSyncState;
  socketConnectionState: SocketConnectionState;
  recentlyUpdatedAuctionIds: Set<string>;

  // Actions
  setAllAuctionItems: (items: AuctionItemState[]) => void;
  addNewAuctionItem: (item: AuctionItemState) => void;
  setIsLoadingAuctionItems: (loading: boolean) => void;
  setAuctionItemsLoadError: (error: string | null) => void;
  updateAuctionItemWithBid: (bidUpdate: BidUpdatePayload) => void;
  markAuctionAsEnded: (auctionItemId: string, winnerUserId: string | null, winnerUsername: string | null) => void;
  updateTimeSyncState: (syncState: Partial<TimeSyncState>) => void;
  updateSocketConnectionState: (state: Partial<SocketConnectionState>) => void;
  markAuctionAsRecentlyUpdated: (auctionItemId: string) => void;
  clearRecentlyUpdatedFlag: (auctionItemId: string) => void;

  // Selectors
  getAuctionItemById: (id: string) => AuctionItemState | undefined;
  getServerSyncedCurrentTimeInMs: () => number;
  isUserWinningAuction: (auctionItemId: string, userId: string) => boolean;
  isUserOutbidOnAuction: (auctionItemId: string, userId: string) => boolean;
}

export const useAuctionStore = create<AuctionStoreState>()(
  devtools(
    (set, get) => ({
      allAuctionItems: [],
      isLoadingAuctionItems: false,
      auctionItemsLoadError: null,
      timeSyncState: { serverTimeOffsetInMs: 0, lastSyncTimestamp: 0, isTimeSynced: false, roundTripTimeInMs: 0 },
      socketConnectionState: { isConnected: false, connectionError: null, reconnectAttempts: 0 },
      recentlyUpdatedAuctionIds: new Set(),

      setAllAuctionItems: (items) => set({ allAuctionItems: items }, false, 'setAllAuctionItems'),

      addNewAuctionItem: (item) =>
        set(
          (state) => {
            // Only add if not already exists
            if (state.allAuctionItems.some((existing) => existing.id === item.id)) {
              return state;
            }
            return { allAuctionItems: [item, ...state.allAuctionItems] };
          },
          false,
          'addNewAuctionItem'
        ),

      setIsLoadingAuctionItems: (loading) => set({ isLoadingAuctionItems: loading }, false, 'setIsLoadingAuctionItems'),

      setAuctionItemsLoadError: (error) => set({ auctionItemsLoadError: error }, false, 'setAuctionItemsLoadError'),

      updateAuctionItemWithBid: (bidUpdate) =>
        set(
          (state) => ({
            allAuctionItems: state.allAuctionItems.map((item) =>
              item.id === bidUpdate.auctionItemId
                ? {
                    ...item,
                    currentHighestBidInDollars: bidUpdate.newHighestBidInDollars,
                    totalBidCount: bidUpdate.totalNumberOfBids,
                    highestBidder: { userId: bidUpdate.highestBidderUserId, username: bidUpdate.highestBidderUsername }
                  }
                : item
            )
          }),
          false,
          'updateAuctionItemWithBid'
        ),

      markAuctionAsEnded: (auctionItemId, winnerUserId, winnerUsername) =>
        set(
          (state) => ({
            allAuctionItems: state.allAuctionItems.map((item) =>
              item.id === auctionItemId
                ? {
                    ...item,
                    currentStatus: 'ENDED' as const,
                    winnerUser: winnerUserId && winnerUsername ? { userId: winnerUserId, username: winnerUsername, fullName: '' } : null
                  }
                : item
            )
          }),
          false,
          'markAuctionAsEnded'
        ),

      updateTimeSyncState: (syncState) =>
        set((state) => ({ timeSyncState: { ...state.timeSyncState, ...syncState } }), false, 'updateTimeSyncState'),

      updateSocketConnectionState: (connectionState) =>
        set(
          (state) => ({ socketConnectionState: { ...state.socketConnectionState, ...connectionState } }),
          false,
          'updateSocketConnectionState'
        ),

      markAuctionAsRecentlyUpdated: (auctionItemId) =>
        set(
          (state) => {
            const newSet = new Set(state.recentlyUpdatedAuctionIds);
            newSet.add(auctionItemId);
            return { recentlyUpdatedAuctionIds: newSet };
          },
          false,
          'markAuctionAsRecentlyUpdated'
        ),

      clearRecentlyUpdatedFlag: (auctionItemId) =>
        set(
          (state) => {
            const newSet = new Set(state.recentlyUpdatedAuctionIds);
            newSet.delete(auctionItemId);
            return { recentlyUpdatedAuctionIds: newSet };
          },
          false,
          'clearRecentlyUpdatedFlag'
        ),

      getAuctionItemById: (id) => get().allAuctionItems.find((item) => item.id === id),

      getServerSyncedCurrentTimeInMs: () => {
        const { serverTimeOffsetInMs, isTimeSynced } = get().timeSyncState;
        return isTimeSynced ? Date.now() + serverTimeOffsetInMs : Date.now();
      },

      isUserWinningAuction: (auctionItemId, userId) => {
        const item = get().getAuctionItemById(auctionItemId);
        return item?.highestBidder?.userId === userId;
      },

      isUserOutbidOnAuction: (auctionItemId, userId) => {
        const item = get().getAuctionItemById(auctionItemId);
        return !!item?.highestBidder && item.highestBidder.userId !== userId && item.totalBidCount > 0;
      }
    }),
    { name: 'AuctionStore' }
  )
);

export default useAuctionStore;
