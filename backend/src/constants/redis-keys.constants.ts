// ==============================|| REDIS KEYS CONSTANTS ||============================== //
// Defines all Redis key patterns used throughout the application

// ==============================|| BID PROCESSING LOCKS ||============================== //
// Keys for distributed locks to prevent race conditions during bid processing

export const REDIS_KEY_PREFIX_FOR_BID_PROCESSING_LOCK = 'lock:bid-processing:';

export function generateBidProcessingLockKey(auctionItemId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_BID_PROCESSING_LOCK}${auctionItemId}`;
}

// ==============================|| AUCTION STATE CACHE ||============================== //
// Keys for caching current auction state for fast reads

export const REDIS_KEY_PREFIX_FOR_CURRENT_BID = 'auction:current-bid:';
export const REDIS_KEY_PREFIX_FOR_HIGHEST_BIDDER = 'auction:highest-bidder:';
export const REDIS_KEY_PREFIX_FOR_AUCTION_STATUS = 'auction:status:';

export function generateCurrentBidCacheKey(auctionItemId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_CURRENT_BID}${auctionItemId}`;
}

export function generateHighestBidderCacheKey(auctionItemId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_HIGHEST_BIDDER}${auctionItemId}`;
}

export function generateAuctionStatusCacheKey(auctionItemId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_AUCTION_STATUS}${auctionItemId}`;
}

// ==============================|| TOKEN BLACKLIST ||============================== //
// Keys for storing blacklisted JWT tokens

export const REDIS_KEY_PREFIX_FOR_BLACKLISTED_TOKEN = 'blacklist:token:';

export function generateBlacklistedTokenKey(tokenString: string): string {
  return `${REDIS_KEY_PREFIX_FOR_BLACKLISTED_TOKEN}${tokenString}`;
}

// ==============================|| USER SESSIONS ||============================== //
// Keys for tracking active user sessions

export const REDIS_KEY_PREFIX_FOR_USER_SESSION = 'session:user:';
export const REDIS_KEY_PREFIX_FOR_SOCKET_TO_USER = 'socket:user-mapping:';

export function generateUserSessionKey(userId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_USER_SESSION}${userId}`;
}

export function generateSocketToUserMappingKey(socketId: string): string {
  return `${REDIS_KEY_PREFIX_FOR_SOCKET_TO_USER}${socketId}`;
}

// ==============================|| RATE LIMITING ||============================== //
// Keys for rate limiting

export const REDIS_KEY_PREFIX_FOR_RATE_LIMIT = 'ratelimit:';

export function generateRateLimitKey(ipAddress: string, endpoint: string): string {
  return `${REDIS_KEY_PREFIX_FOR_RATE_LIMIT}${ipAddress}:${endpoint}`;
}

// ==============================|| CACHE TTL VALUES (IN SECONDS) ||============================== //
// Time-to-live values for various cached data

export const CACHE_TTL_FOR_AUCTION_STATE_IN_SECONDS = 60; // 1 minute
export const CACHE_TTL_FOR_BLACKLISTED_TOKEN_IN_SECONDS = 86400; // 24 hours (matches JWT expiry)
export const CACHE_TTL_FOR_USER_SESSION_IN_SECONDS = 86400; // 24 hours
export const LOCK_TTL_FOR_BID_PROCESSING_IN_MILLISECONDS = 5000; // 5 seconds
