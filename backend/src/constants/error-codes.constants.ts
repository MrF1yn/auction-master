// ==============================|| ERROR CODES CONSTANTS ||============================== //
// Defines all error codes and messages used throughout the application

// ==============================|| AUTHENTICATION ERRORS ||============================== //

export const AUTH_ERROR_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS';
export const AUTH_ERROR_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED';
export const AUTH_ERROR_TOKEN_INVALID = 'AUTH_TOKEN_INVALID';
export const AUTH_ERROR_TOKEN_BLACKLISTED = 'AUTH_TOKEN_BLACKLISTED';
export const AUTH_ERROR_TOKEN_MISSING = 'AUTH_TOKEN_MISSING';
export const AUTH_ERROR_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND';
export const AUTH_ERROR_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS';
export const AUTH_ERROR_USERNAME_ALREADY_EXISTS = 'AUTH_USERNAME_ALREADY_EXISTS';
export const AUTH_ERROR_ACCOUNT_INACTIVE = 'AUTH_ACCOUNT_INACTIVE';

// ==============================|| BID ERRORS ||============================== //

export const BID_ERROR_CONCURRENT_BID = 'BID_CONCURRENT_BID_ERROR';
export const BID_ERROR_AUCTION_ENDED = 'BID_AUCTION_ENDED';
export const BID_ERROR_AUCTION_NOT_STARTED = 'BID_AUCTION_NOT_STARTED';
export const BID_ERROR_AUCTION_NOT_FOUND = 'BID_AUCTION_NOT_FOUND';
export const BID_ERROR_BID_TOO_LOW = 'BID_AMOUNT_TOO_LOW';
export const BID_ERROR_INVALID_AMOUNT = 'BID_INVALID_AMOUNT';
export const BID_ERROR_OWN_AUCTION = 'BID_CANNOT_BID_ON_OWN_AUCTION';
export const BID_ERROR_PROCESSING_FAILED = 'BID_PROCESSING_FAILED';
export const BID_ERROR_LOCK_ACQUISITION_FAILED = 'BID_LOCK_ACQUISITION_FAILED';

// ==============================|| AUCTION ERRORS ||============================== //

export const AUCTION_ERROR_NOT_FOUND = 'AUCTION_NOT_FOUND';
export const AUCTION_ERROR_ALREADY_ENDED = 'AUCTION_ALREADY_ENDED';
export const AUCTION_ERROR_NOT_ACTIVE = 'AUCTION_NOT_ACTIVE';
export const AUCTION_ERROR_INVALID_DATES = 'AUCTION_INVALID_DATES';

// ==============================|| VALIDATION ERRORS ||============================== //

export const VALIDATION_ERROR_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL';
export const VALIDATION_ERROR_INVALID_PASSWORD = 'VALIDATION_INVALID_PASSWORD';
export const VALIDATION_ERROR_INVALID_USERNAME = 'VALIDATION_INVALID_USERNAME';
export const VALIDATION_ERROR_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD';
export const VALIDATION_ERROR_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT';

// ==============================|| SERVER ERRORS ||============================== //

export const SERVER_ERROR_INTERNAL = 'SERVER_INTERNAL_ERROR';
export const SERVER_ERROR_DATABASE = 'SERVER_DATABASE_ERROR';
export const SERVER_ERROR_REDIS = 'SERVER_REDIS_ERROR';
export const SERVER_ERROR_RATE_LIMIT = 'SERVER_RATE_LIMIT_EXCEEDED';

// ==============================|| ERROR MESSAGES MAP ||============================== //
// Human-readable error messages for each error code

export const ERROR_MESSAGES_MAP: Record<string, string> = {
  // Authentication
  [AUTH_ERROR_INVALID_CREDENTIALS]: 'Invalid email/username or password',
  [AUTH_ERROR_TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [AUTH_ERROR_TOKEN_INVALID]: 'Invalid authentication token',
  [AUTH_ERROR_TOKEN_BLACKLISTED]: 'This session has been logged out',
  [AUTH_ERROR_TOKEN_MISSING]: 'Authentication token is required',
  [AUTH_ERROR_USER_NOT_FOUND]: 'User not found',
  [AUTH_ERROR_EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',
  [AUTH_ERROR_USERNAME_ALREADY_EXISTS]: 'This username is already taken',
  [AUTH_ERROR_ACCOUNT_INACTIVE]: 'Your account has been deactivated',

  // Bidding
  [BID_ERROR_CONCURRENT_BID]: 'Another bid was placed at the same time. Please try again',
  [BID_ERROR_AUCTION_ENDED]: 'This auction has already ended',
  [BID_ERROR_AUCTION_NOT_STARTED]: 'This auction has not started yet',
  [BID_ERROR_AUCTION_NOT_FOUND]: 'Auction not found',
  [BID_ERROR_BID_TOO_LOW]: 'Your bid must be higher than the current bid plus minimum increment',
  [BID_ERROR_INVALID_AMOUNT]: 'Invalid bid amount',
  [BID_ERROR_OWN_AUCTION]: 'You cannot bid on your own auction',
  [BID_ERROR_PROCESSING_FAILED]: 'Failed to process bid. Please try again',
  [BID_ERROR_LOCK_ACQUISITION_FAILED]: 'Bid processing is busy. Please try again',

  // Auction
  [AUCTION_ERROR_NOT_FOUND]: 'Auction not found',
  [AUCTION_ERROR_ALREADY_ENDED]: 'This auction has already ended',
  [AUCTION_ERROR_NOT_ACTIVE]: 'This auction is not currently active',
  [AUCTION_ERROR_INVALID_DATES]: 'Invalid auction dates',

  // Validation
  [VALIDATION_ERROR_INVALID_EMAIL]: 'Please enter a valid email address',
  [VALIDATION_ERROR_INVALID_PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  [VALIDATION_ERROR_INVALID_USERNAME]: 'Username must be 3-30 characters, alphanumeric and underscores only',
  [VALIDATION_ERROR_REQUIRED_FIELD]: 'This field is required',
  [VALIDATION_ERROR_INVALID_FORMAT]: 'Invalid format',

  // Server
  [SERVER_ERROR_INTERNAL]: 'An unexpected error occurred. Please try again later',
  [SERVER_ERROR_DATABASE]: 'Database error. Please try again later',
  [SERVER_ERROR_REDIS]: 'Service temporarily unavailable. Please try again',
  [SERVER_ERROR_RATE_LIMIT]: 'Too many requests. Please wait and try again'
};

// ==============================|| HELPER FUNCTION ||============================== //

export function getErrorMessageFromCode(errorCode: string): string {
  return ERROR_MESSAGES_MAP[errorCode] || 'An unknown error occurred';
}

// ==============================|| HTTP STATUS CODES ||============================== //

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
