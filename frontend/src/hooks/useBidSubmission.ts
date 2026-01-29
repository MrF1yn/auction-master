// Hook for submitting bids via WebSocket

import { useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL || 'http://localhost:3010';
const BID_TIMEOUT = 10000;

interface BidResult {
  wasSuccessful: boolean;
  bidId?: string;
  errorMessage?: string;
}

export function useBidSubmission() {
  const [isBidSubmissionInProgress, setIsBidSubmissionInProgress] = useState(false);
  const [lastBidSubmissionError, setLastBidSubmissionError] = useState<string | null>(null);

  const clearBidSubmissionError = useCallback(() => setLastBidSubmissionError(null), []);

  const submitBidForAuction = useCallback(async (auctionItemId: string, bidAmountInDollars: number): Promise<BidResult> => {
    setIsBidSubmissionInProgress(true);
    setLastBidSubmissionError(null);

    return new Promise((resolve) => {
      const token = localStorage.getItem('serviceToken');

      if (!token) {
        setIsBidSubmissionInProgress(false);
        setLastBidSubmissionError('Not authenticated');
        resolve({ wasSuccessful: false, errorMessage: 'Not authenticated' });
        return;
      }

      const socket: Socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      const timeoutId = setTimeout(() => {
        socket.disconnect();
        setIsBidSubmissionInProgress(false);
        setLastBidSubmissionError('Bid submission timed out');
        resolve({ wasSuccessful: false, errorMessage: 'Bid submission timed out' });
      }, BID_TIMEOUT);

      socket.on('connect', () => {
        socket.emit('JOIN_AUCTION_ROOM', { auctionItemId });
        socket.emit('PLACE_BID', { auctionItemId, bidAmountInDollars });
      });

      socket.on('BID_PLACED_SUCCESS', (response: { bidId: string }) => {
        clearTimeout(timeoutId);
        socket.disconnect();
        setIsBidSubmissionInProgress(false);
        resolve({ wasSuccessful: true, bidId: response.bidId });
      });

      socket.on('BID_PLACED_ERROR', (error: { errorMessage: string }) => {
        clearTimeout(timeoutId);
        socket.disconnect();
        setIsBidSubmissionInProgress(false);
        setLastBidSubmissionError(error.errorMessage);
        resolve({ wasSuccessful: false, errorMessage: error.errorMessage });
      });

      socket.on('connect_error', (error: Error) => {
        clearTimeout(timeoutId);
        setIsBidSubmissionInProgress(false);
        setLastBidSubmissionError(error.message);
        resolve({ wasSuccessful: false, errorMessage: error.message });
      });
    });
  }, []);

  return {
    submitBidForAuction,
    isBidSubmissionInProgress,
    lastBidSubmissionError,
    clearBidSubmissionError
  };
}

export default useBidSubmission;
