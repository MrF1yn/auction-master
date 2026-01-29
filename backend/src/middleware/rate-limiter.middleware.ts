// ==============================|| RATE LIMITER MIDDLEWARE ||============================== //
// Implements rate limiting for API endpoints

import rateLimit from 'express-rate-limit';
import { environmentConfig } from '../config/environment.config';
import { HTTP_STATUS_TOO_MANY_REQUESTS, SERVER_ERROR_RATE_LIMIT, getErrorMessageFromCode } from '../constants/error-codes.constants';

// ==============================|| GENERAL RATE LIMITER ||============================== //
// Applies to all routes

export const generalRateLimiter = rateLimit({
  windowMs: environmentConfig.RATE_LIMIT_WINDOW_IN_MINUTES * 60 * 1000,
  max: environmentConfig.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: SERVER_ERROR_RATE_LIMIT,
    errorMessage: getErrorMessageFromCode(SERVER_ERROR_RATE_LIMIT)
  },
  statusCode: HTTP_STATUS_TOO_MANY_REQUESTS
});

// ==============================|| STRICT RATE LIMITER FOR AUTH ||============================== //
// More restrictive rate limiting for authentication endpoints

export const authenticationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: SERVER_ERROR_RATE_LIMIT,
    errorMessage: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  statusCode: HTTP_STATUS_TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true // Don't count successful logins
});

// ==============================|| BID RATE LIMITER ||============================== //
// Rate limiting for bid submissions to prevent spam

export const bidSubmissionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 bids per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: SERVER_ERROR_RATE_LIMIT,
    errorMessage: 'Too many bid attempts. Please slow down.'
  },
  statusCode: HTTP_STATUS_TOO_MANY_REQUESTS
});
