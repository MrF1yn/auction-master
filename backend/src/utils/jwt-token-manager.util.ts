// ==============================|| JWT TOKEN MANAGER UTILITY ||============================== //
// Handles JWT token generation, verification, and decoding

import jwt from 'jsonwebtoken';
import { environmentConfig } from '../config/environment.config';

// ==============================|| TOKEN PAYLOAD INTERFACE ||============================== //

export interface JwtTokenPayload {
  userId: string;
  userEmail: string;
  userFullName: string;
  username: string;
  tokenIssuedAtTimestamp: number;
  tokenExpiresAtTimestamp: number;
}

export interface DecodedJwtToken extends JwtTokenPayload {
  iat: number;
  exp: number;
}

// ==============================|| GENERATE JWT TOKEN ||============================== //
// Creates a new JWT token with user information

export function generateJwtTokenForUser(userDataForToken: {
  userId: string;
  userEmail: string;
  userFullName: string;
  username: string;
}): string {
  const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
  const expirationTimestampInSeconds = currentTimestampInSeconds + environmentConfig.JWT_EXPIRATION_TIME_IN_HOURS * 3600;

  const tokenPayload: JwtTokenPayload = {
    userId: userDataForToken.userId,
    userEmail: userDataForToken.userEmail,
    userFullName: userDataForToken.userFullName,
    username: userDataForToken.username,
    tokenIssuedAtTimestamp: currentTimestampInSeconds * 1000,
    tokenExpiresAtTimestamp: expirationTimestampInSeconds * 1000
  };

  const generatedToken = jwt.sign(tokenPayload, environmentConfig.JWT_SECRET_KEY, {
    algorithm: 'HS256',
    expiresIn: `${environmentConfig.JWT_EXPIRATION_TIME_IN_HOURS}h`
  });

  return generatedToken;
}

// ==============================|| VERIFY JWT TOKEN ||============================== //
// Verifies a JWT token and returns the decoded payload

export interface TokenVerificationResult {
  isTokenValid: boolean;
  decodedPayload: DecodedJwtToken | null;
  errorMessage: string | null;
}

export function verifyAndDecodeJwtToken(tokenToVerify: string): TokenVerificationResult {
  try {
    const decodedPayload = jwt.verify(tokenToVerify, environmentConfig.JWT_SECRET_KEY, { algorithms: ['HS256'] }) as DecodedJwtToken;

    return {
      isTokenValid: true,
      decodedPayload,
      errorMessage: null
    };
  } catch (verificationError) {
    if (verificationError instanceof jwt.TokenExpiredError) {
      return {
        isTokenValid: false,
        decodedPayload: null,
        errorMessage: 'Token has expired'
      };
    }

    if (verificationError instanceof jwt.JsonWebTokenError) {
      return {
        isTokenValid: false,
        decodedPayload: null,
        errorMessage: 'Invalid token'
      };
    }

    return {
      isTokenValid: false,
      decodedPayload: null,
      errorMessage: 'Token verification failed'
    };
  }
}

// ==============================|| DECODE TOKEN WITHOUT VERIFICATION ||============================== //
// Decodes a JWT token without verifying the signature (useful for getting expiry time)

export function decodeJwtTokenWithoutVerification(tokenToDecode: string): DecodedJwtToken | null {
  try {
    const decodedToken = jwt.decode(tokenToDecode) as DecodedJwtToken | null;
    return decodedToken;
  } catch {
    return null;
  }
}

// ==============================|| EXTRACT TOKEN FROM HEADER ||============================== //
// Extracts JWT token from Authorization header

export function extractTokenFromAuthorizationHeader(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const BEARER_PREFIX = 'Bearer ';
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const extractedToken = authorizationHeader.substring(BEARER_PREFIX.length);
  return extractedToken.trim() || null;
}

// ==============================|| CALCULATE TOKEN REMAINING TIME ||============================== //
// Calculates the remaining time in seconds until token expiration

export function calculateTokenRemainingTimeInSeconds(tokenExpiresAtTimestamp: number): number {
  const currentTimestampInMs = Date.now();
  const remainingTimeInMs = tokenExpiresAtTimestamp - currentTimestampInMs;
  const remainingTimeInSeconds = Math.max(0, Math.floor(remainingTimeInMs / 1000));
  return remainingTimeInSeconds;
}
