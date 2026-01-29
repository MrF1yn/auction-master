// ==============================|| BID PROCESSOR SERVICE ||============================== //
// Handles bid processing with race condition prevention using Redis distributed locks

import { Decimal } from '@prisma/client/runtime/library';
import { prismaClient } from '../config/prisma-client.config';
import { redisClient } from '../config/redis-client.config';
import { executeWithDistributedLock } from '../lib/redis-lock-manager.lib';
import {
  generateCurrentBidCacheKey,
  generateHighestBidderCacheKey,
  CACHE_TTL_FOR_AUCTION_STATE_IN_SECONDS
} from '../constants/redis-keys.constants';
import {
  BID_ERROR_AUCTION_NOT_FOUND,
  BID_ERROR_AUCTION_ENDED,
  BID_ERROR_AUCTION_NOT_STARTED,
  BID_ERROR_BID_TOO_LOW,
  BID_ERROR_OWN_AUCTION,
  BID_ERROR_LOCK_ACQUISITION_FAILED,
  BID_ERROR_PROCESSING_FAILED,
  getErrorMessageFromCode
} from '../constants/error-codes.constants';
import { logBidProcessingEvent, logErrorMessage } from '../utils/logger.util';

// ==============================|| BID RESULT INTERFACES ||============================== //

export interface BidProcessingResult {
  wasBidSuccessful: boolean;
  bidId: string | null;
  newHighestBidInDollars: number | null;
  previousHighestBidInDollars: number | null;
  bidPlacedAtTimestamp: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  processingTimeInMs: number;
}

export interface AuctionBidInfo {
  auctionItemId: string;
  currentHighestBidInDollars: number;
  highestBidderUserId: string | null;
  highestBidderUsername: string | null;
  minimumBidIncrementInDollars: number;
  auctionEndTimeTimestamp: Date;
  totalNumberOfBids: number;
}

// ==============================|| PROCESS BID WITH LOCK ||============================== //

export async function processBidWithDistributedLock(
  auctionItemId: string,
  bidderUserId: string,
  bidAmountInDollars: number
): Promise<BidProcessingResult> {
  const processingStartTime = Date.now();

  logBidProcessingEvent('BID_RECEIVED', auctionItemId, bidderUserId, { bidAmountInDollars });

  // Execute bid processing within a distributed lock
  const lockExecutionResult = await executeWithDistributedLock<BidProcessingResult>(auctionItemId, async () => {
    return await processBidTransaction(auctionItemId, bidderUserId, bidAmountInDollars);
  });

  const processingTimeInMs = Date.now() - processingStartTime;

  if (!lockExecutionResult.wasLockAcquired) {
    logBidProcessingEvent('BID_FAILED', auctionItemId, bidderUserId, {
      reason: 'Lock acquisition failed',
      processingTimeInMs
    });

    return {
      wasBidSuccessful: false,
      bidId: null,
      newHighestBidInDollars: null,
      previousHighestBidInDollars: null,
      bidPlacedAtTimestamp: null,
      errorCode: BID_ERROR_LOCK_ACQUISITION_FAILED,
      errorMessage: getErrorMessageFromCode(BID_ERROR_LOCK_ACQUISITION_FAILED),
      processingTimeInMs
    };
  }

  if (!lockExecutionResult.wasExecutionSuccessful || !lockExecutionResult.executionResult) {
    logBidProcessingEvent('BID_FAILED', auctionItemId, bidderUserId, {
      reason: lockExecutionResult.errorMessage,
      processingTimeInMs
    });

    return {
      wasBidSuccessful: false,
      bidId: null,
      newHighestBidInDollars: null,
      previousHighestBidInDollars: null,
      bidPlacedAtTimestamp: null,
      errorCode: BID_ERROR_PROCESSING_FAILED,
      errorMessage: lockExecutionResult.errorMessage || 'Bid processing failed',
      processingTimeInMs
    };
  }

  const result = lockExecutionResult.executionResult;
  result.processingTimeInMs = processingTimeInMs;

  if (result.wasBidSuccessful) {
    logBidProcessingEvent('BID_PROCESSED', auctionItemId, bidderUserId, {
      bidId: result.bidId,
      newHighestBid: result.newHighestBidInDollars,
      processingTimeInMs
    });
  }

  return result;
}

// ==============================|| BID TRANSACTION (WITHIN LOCK) ||============================== //

async function processBidTransaction(
  auctionItemId: string,
  bidderUserId: string,
  bidAmountInDollars: number
): Promise<BidProcessingResult> {
  // Step 1: Fetch the auction item
  const auctionItem = await prismaClient.auctionItem.findUnique({
    where: { id: auctionItemId },
    include: {
      creatorUser: { select: { id: true, username: true } }
    }
  });

  if (!auctionItem) {
    return createErrorResult(BID_ERROR_AUCTION_NOT_FOUND);
  }

  // Step 2: Validate auction status and timing
  const currentTimestamp = new Date();

  if (auctionItem.currentStatus !== 'ACTIVE') {
    return createErrorResult(BID_ERROR_AUCTION_ENDED);
  }

  if (currentTimestamp < auctionItem.auctionStartTimeTimestamp) {
    return createErrorResult(BID_ERROR_AUCTION_NOT_STARTED);
  }

  if (currentTimestamp >= auctionItem.auctionEndTimeTimestamp) {
    return createErrorResult(BID_ERROR_AUCTION_ENDED);
  }

  // Step 3: Check if bidder is the creator
  if (auctionItem.creatorUserId === bidderUserId) {
    return createErrorResult(BID_ERROR_OWN_AUCTION);
  }

  // Step 4: Validate bid amount
  const currentBidAsNumber = auctionItem.currentHighestBidInDollars.toNumber();
  const minimumIncrementAsNumber = auctionItem.minimumBidIncrementInDollars.toNumber();
  const minimumRequiredBid = currentBidAsNumber + minimumIncrementAsNumber;

  if (bidAmountInDollars < minimumRequiredBid) {
    return {
      wasBidSuccessful: false,
      bidId: null,
      newHighestBidInDollars: null,
      previousHighestBidInDollars: currentBidAsNumber,
      bidPlacedAtTimestamp: null,
      errorCode: BID_ERROR_BID_TOO_LOW,
      errorMessage: `Bid must be at least $${minimumRequiredBid.toFixed(2)} (current: $${currentBidAsNumber.toFixed(2)} + increment: $${minimumIncrementAsNumber.toFixed(2)})`,
      processingTimeInMs: 0
    };
  }

  // Step 5: Execute the transaction
  const bidPlacedAtTimestamp = new Date();
  const bidAmountDecimal = new Decimal(bidAmountInDollars);

  const [, createdBid] = await prismaClient.$transaction([
    // Update the auction with new highest bid
    prismaClient.auctionItem.update({
      where: { id: auctionItemId },
      data: {
        currentHighestBidInDollars: bidAmountDecimal,
        updatedAtTimestamp: bidPlacedAtTimestamp
      }
    }),
    // Create the bid record
    prismaClient.bid.create({
      data: {
        auctionItemId,
        bidderUserId,
        bidAmountInDollars: bidAmountDecimal,
        placedAtTimestamp: bidPlacedAtTimestamp,
        wasBidSuccessful: true
      }
    })
  ]);

  // Step 6: Update Redis cache
  await updateAuctionCacheInRedis(auctionItemId, bidAmountInDollars, bidderUserId);

  return {
    wasBidSuccessful: true,
    bidId: createdBid.id,
    newHighestBidInDollars: bidAmountInDollars,
    previousHighestBidInDollars: currentBidAsNumber,
    bidPlacedAtTimestamp,
    errorCode: null,
    errorMessage: null,
    processingTimeInMs: 0
  };
}

// ==============================|| HELPER FUNCTIONS ||============================== //

function createErrorResult(errorCode: string): BidProcessingResult {
  return {
    wasBidSuccessful: false,
    bidId: null,
    newHighestBidInDollars: null,
    previousHighestBidInDollars: null,
    bidPlacedAtTimestamp: null,
    errorCode,
    errorMessage: getErrorMessageFromCode(errorCode),
    processingTimeInMs: 0
  };
}

async function updateAuctionCacheInRedis(auctionItemId: string, currentBidInDollars: number, highestBidderUserId: string): Promise<void> {
  try {
    const currentBidKey = generateCurrentBidCacheKey(auctionItemId);
    const highestBidderKey = generateHighestBidderCacheKey(auctionItemId);

    await Promise.all([
      redisClient.setex(currentBidKey, CACHE_TTL_FOR_AUCTION_STATE_IN_SECONDS, currentBidInDollars.toString()),
      redisClient.setex(highestBidderKey, CACHE_TTL_FOR_AUCTION_STATE_IN_SECONDS, highestBidderUserId)
    ]);
  } catch (cacheError) {
    // Log but don't fail - cache is non-critical
    logErrorMessage('Failed to update auction cache in Redis', cacheError, { auctionItemId });
  }
}

// ==============================|| GET AUCTION BID INFO ||============================== //

export async function fetchCurrentAuctionBidInfo(auctionItemId: string): Promise<AuctionBidInfo | null> {
  try {
    const auctionItem = await prismaClient.auctionItem.findUnique({
      where: { id: auctionItemId },
      include: {
        _count: {
          select: { allBidsOnItem: true }
        }
      }
    });

    if (!auctionItem) {
      return null;
    }

    // Get highest bidder info
    const highestBid = await prismaClient.bid.findFirst({
      where: {
        auctionItemId,
        wasBidSuccessful: true
      },
      orderBy: {
        bidAmountInDollars: 'desc'
      },
      include: {
        bidderUser: {
          select: { id: true, username: true }
        }
      }
    });

    return {
      auctionItemId: auctionItem.id,
      currentHighestBidInDollars: auctionItem.currentHighestBidInDollars.toNumber(),
      highestBidderUserId: highestBid?.bidderUser.id || null,
      highestBidderUsername: highestBid?.bidderUser.username || null,
      minimumBidIncrementInDollars: auctionItem.minimumBidIncrementInDollars.toNumber(),
      auctionEndTimeTimestamp: auctionItem.auctionEndTimeTimestamp,
      totalNumberOfBids: auctionItem._count.allBidsOnItem
    };
  } catch (error) {
    logErrorMessage('Error fetching auction bid info', error, { auctionItemId });
    return null;
  }
}

// ==============================|| RECORD FAILED BID ||============================== //

export async function recordFailedBidAttempt(
  auctionItemId: string,
  bidderUserId: string,
  bidAmountInDollars: number,
  processingTimeInMs: number
): Promise<void> {
  try {
    await prismaClient.bid.create({
      data: {
        auctionItemId,
        bidderUserId,
        bidAmountInDollars: new Decimal(bidAmountInDollars),
        wasBidSuccessful: false,
        bidProcessingTimeInMs: processingTimeInMs
      }
    });
  } catch (error) {
    logErrorMessage('Failed to record failed bid attempt', error, {
      auctionItemId,
      bidderUserId,
      bidAmountInDollars
    });
  }
}
