// ==============================|| AUTHENTICATION MIDDLEWARE ||============================== //
// Verifies JWT tokens and attaches user data to request objects

import { Request, Response, NextFunction } from 'express';
import { verifyAndDecodeJwtToken, extractTokenFromAuthorizationHeader, DecodedJwtToken } from '../utils/jwt-token-manager.util';
import { checkIfTokenIsBlacklisted } from '../services/authentication.service';
import {
  AUTH_ERROR_TOKEN_MISSING,
  AUTH_ERROR_TOKEN_INVALID,
  AUTH_ERROR_TOKEN_EXPIRED,
  AUTH_ERROR_TOKEN_BLACKLISTED,
  HTTP_STATUS_UNAUTHORIZED,
  getErrorMessageFromCode
} from '../constants/error-codes.constants';
import { logDebugMessage } from '../utils/logger.util';

// ==============================|| EXTENDED REQUEST INTERFACE ||============================== //
// Extends Express Request to include authenticated user data

export interface AuthenticatedUserData {
  userId: string;
  userEmail: string;
  userFullName: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: AuthenticatedUserData;
  jwtToken?: string;
}

// ==============================|| JWT AUTHENTICATION MIDDLEWARE ||============================== //
// Validates JWT token and attaches user data to request

export async function requireJwtAuthentication(
  request: AuthenticatedRequest,
  response: Response,
  nextMiddleware: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authorizationHeader = request.headers.authorization;
    const extractedToken = extractTokenFromAuthorizationHeader(authorizationHeader);

    if (!extractedToken) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: AUTH_ERROR_TOKEN_MISSING,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_TOKEN_MISSING)
      });
      return;
    }

    // Verify the token
    const verificationResult = verifyAndDecodeJwtToken(extractedToken);

    if (!verificationResult.isTokenValid) {
      const errorCode = verificationResult.errorMessage?.includes('expired') ? AUTH_ERROR_TOKEN_EXPIRED : AUTH_ERROR_TOKEN_INVALID;

      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode,
        errorMessage: getErrorMessageFromCode(errorCode)
      });
      return;
    }

    // Check if token is blacklisted
    const isTokenBlacklisted = await checkIfTokenIsBlacklisted(extractedToken);

    if (isTokenBlacklisted) {
      response.status(HTTP_STATUS_UNAUTHORIZED).json({
        success: false,
        errorCode: AUTH_ERROR_TOKEN_BLACKLISTED,
        errorMessage: getErrorMessageFromCode(AUTH_ERROR_TOKEN_BLACKLISTED)
      });
      return;
    }

    // Attach user data to request
    const decodedPayload = verificationResult.decodedPayload as DecodedJwtToken;

    request.authenticatedUser = {
      userId: decodedPayload.userId,
      userEmail: decodedPayload.userEmail,
      userFullName: decodedPayload.userFullName,
      username: decodedPayload.username
    };
    request.jwtToken = extractedToken;

    logDebugMessage('JWT authentication successful', {
      userId: decodedPayload.userId,
      path: request.path
    });

    nextMiddleware();
  } catch (authError) {
    response.status(HTTP_STATUS_UNAUTHORIZED).json({
      success: false,
      errorCode: AUTH_ERROR_TOKEN_INVALID,
      errorMessage: 'Authentication failed'
    });
  }
}

// ==============================|| OPTIONAL AUTHENTICATION MIDDLEWARE ||============================== //
// Attempts to authenticate but doesn't fail if no token is present

export async function optionalJwtAuthentication(
  request: AuthenticatedRequest,
  _response: Response,
  nextMiddleware: NextFunction
): Promise<void> {
  try {
    const authorizationHeader = request.headers.authorization;
    const extractedToken = extractTokenFromAuthorizationHeader(authorizationHeader);

    if (!extractedToken) {
      // No token provided, continue without authentication
      nextMiddleware();
      return;
    }

    const verificationResult = verifyAndDecodeJwtToken(extractedToken);

    if (!verificationResult.isTokenValid) {
      // Invalid token, continue without authentication
      nextMiddleware();
      return;
    }

    const isTokenBlacklisted = await checkIfTokenIsBlacklisted(extractedToken);

    if (isTokenBlacklisted) {
      // Blacklisted token, continue without authentication
      nextMiddleware();
      return;
    }

    // Attach user data to request
    const decodedPayload = verificationResult.decodedPayload as DecodedJwtToken;

    request.authenticatedUser = {
      userId: decodedPayload.userId,
      userEmail: decodedPayload.userEmail,
      userFullName: decodedPayload.userFullName,
      username: decodedPayload.username
    };
    request.jwtToken = extractedToken;

    nextMiddleware();
  } catch {
    // On error, continue without authentication
    nextMiddleware();
  }
}
