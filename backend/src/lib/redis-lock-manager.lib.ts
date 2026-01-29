// ==============================|| REDIS LOCK MANAGER ||============================== //
// Implements distributed locking using Redis for race condition prevention
// Uses SETNX with Lua scripts for atomic operations

import { v4 as generateUuidV4 } from 'uuid';
import { redisClient } from '../config/redis-client.config';
import { generateBidProcessingLockKey, LOCK_TTL_FOR_BID_PROCESSING_IN_MILLISECONDS } from '../constants/redis-keys.constants';
import { logDebugMessage, logErrorMessage } from '../utils/logger.util';

// ==============================|| LOCK RESULT INTERFACE ||============================== //

export interface LockAcquisitionResult {
  wasLockAcquiredSuccessfully: boolean;
  uniqueLockIdentifier: string | null;
  errorMessage: string | null;
}

export interface LockReleaseResult {
  wasLockReleasedSuccessfully: boolean;
  errorMessage: string | null;
}

// ==============================|| LUA SCRIPT FOR ATOMIC LOCK RELEASE ||============================== //
// Ensures we only release the lock if we own it (prevents releasing someone else's lock)

const LUA_SCRIPT_FOR_SAFE_LOCK_RELEASE = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

// ==============================|| ACQUIRE DISTRIBUTED LOCK ||============================== //
// Attempts to acquire a lock for a specific auction item

export async function acquireDistributedLockForBidProcessing(
  auctionItemId: string,
  lockTimeoutInMilliseconds: number = LOCK_TTL_FOR_BID_PROCESSING_IN_MILLISECONDS
): Promise<LockAcquisitionResult> {
  const lockKeyName = generateBidProcessingLockKey(auctionItemId);
  const uniqueLockIdentifier = generateUuidV4();

  try {
    // SET key value PX milliseconds NX
    // NX - Only set if key does not exist
    // PX - Set expiration in milliseconds
    const lockAcquisitionResponse = await redisClient.set(lockKeyName, uniqueLockIdentifier, 'PX', lockTimeoutInMilliseconds, 'NX');

    const wasLockAcquiredSuccessfully = lockAcquisitionResponse === 'OK';

    if (wasLockAcquiredSuccessfully) {
      logDebugMessage('Distributed lock acquired successfully', {
        lockKeyName,
        uniqueLockIdentifier,
        lockTimeoutInMilliseconds,
        auctionItemId
      });

      return {
        wasLockAcquiredSuccessfully: true,
        uniqueLockIdentifier,
        errorMessage: null
      };
    }

    logDebugMessage('Failed to acquire distributed lock - lock already held', {
      lockKeyName,
      auctionItemId
    });

    return {
      wasLockAcquiredSuccessfully: false,
      uniqueLockIdentifier: null,
      errorMessage: 'Lock is currently held by another process'
    };
  } catch (lockAcquisitionError) {
    logErrorMessage('Error while attempting to acquire distributed lock', lockAcquisitionError, { lockKeyName, auctionItemId });

    return {
      wasLockAcquiredSuccessfully: false,
      uniqueLockIdentifier: null,
      errorMessage: 'Failed to acquire lock due to Redis error'
    };
  }
}

// ==============================|| RELEASE DISTRIBUTED LOCK ||============================== //
// Releases a lock only if we own it (using Lua script for atomicity)

export async function releaseDistributedLockForBidProcessing(
  auctionItemId: string,
  uniqueLockIdentifier: string
): Promise<LockReleaseResult> {
  const lockKeyName = generateBidProcessingLockKey(auctionItemId);

  try {
    // Use Lua script to atomically check and delete
    const lockReleaseResponse = await redisClient.eval(LUA_SCRIPT_FOR_SAFE_LOCK_RELEASE, 1, lockKeyName, uniqueLockIdentifier);

    const wasLockReleasedSuccessfully = lockReleaseResponse === 1;

    if (wasLockReleasedSuccessfully) {
      logDebugMessage('Distributed lock released successfully', {
        lockKeyName,
        uniqueLockIdentifier,
        auctionItemId
      });

      return {
        wasLockReleasedSuccessfully: true,
        errorMessage: null
      };
    }

    logDebugMessage('Lock was not released - may have expired or been released by another process', {
      lockKeyName,
      uniqueLockIdentifier,
      auctionItemId
    });

    return {
      wasLockReleasedSuccessfully: false,
      errorMessage: 'Lock was not owned by this process or has already expired'
    };
  } catch (lockReleaseError) {
    logErrorMessage('Error while attempting to release distributed lock', lockReleaseError, {
      lockKeyName,
      auctionItemId,
      uniqueLockIdentifier
    });

    return {
      wasLockReleasedSuccessfully: false,
      errorMessage: 'Failed to release lock due to Redis error'
    };
  }
}

// ==============================|| EXECUTE WITH LOCK ||============================== //
// Helper function to execute a callback while holding a lock

export interface ExecuteWithLockResult<T> {
  wasExecutionSuccessful: boolean;
  executionResult: T | null;
  errorMessage: string | null;
  wasLockAcquired: boolean;
}

export async function executeWithDistributedLock<T>(
  auctionItemId: string,
  callbackToExecuteWhileHoldingLock: () => Promise<T>,
  lockTimeoutInMilliseconds: number = LOCK_TTL_FOR_BID_PROCESSING_IN_MILLISECONDS
): Promise<ExecuteWithLockResult<T>> {
  // Step 1: Acquire the lock
  const lockAcquisitionResult = await acquireDistributedLockForBidProcessing(auctionItemId, lockTimeoutInMilliseconds);

  if (!lockAcquisitionResult.wasLockAcquiredSuccessfully) {
    return {
      wasExecutionSuccessful: false,
      executionResult: null,
      errorMessage: lockAcquisitionResult.errorMessage,
      wasLockAcquired: false
    };
  }

  const uniqueLockIdentifier = lockAcquisitionResult.uniqueLockIdentifier!;

  try {
    // Step 2: Execute the callback
    const executionResult = await callbackToExecuteWhileHoldingLock();

    return {
      wasExecutionSuccessful: true,
      executionResult,
      errorMessage: null,
      wasLockAcquired: true
    };
  } catch (executionError) {
    const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown error during locked execution';

    logErrorMessage('Error during locked execution', executionError, { auctionItemId });

    return {
      wasExecutionSuccessful: false,
      executionResult: null,
      errorMessage,
      wasLockAcquired: true
    };
  } finally {
    // Step 3: Always release the lock
    await releaseDistributedLockForBidProcessing(auctionItemId, uniqueLockIdentifier);
  }
}

// ==============================|| CHECK LOCK STATUS ||============================== //
// Checks if a lock is currently held (for debugging/monitoring)

export async function checkIfLockIsCurrentlyHeld(auctionItemId: string): Promise<boolean> {
  const lockKeyName = generateBidProcessingLockKey(auctionItemId);

  try {
    const currentLockValue = await redisClient.get(lockKeyName);
    return currentLockValue !== null;
  } catch (checkError) {
    logErrorMessage('Error checking lock status', checkError, { lockKeyName });
    return false;
  }
}
