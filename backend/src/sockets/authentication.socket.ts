// Socket.io authentication middleware using JWT

import { Socket } from 'socket.io';
import { verifyAndDecodeJwtToken, DecodedJwtToken } from '../utils/jwt-token-manager.util';
import { checkIfTokenIsBlacklisted } from '../services/authentication.service';
import { logSocketEvent, logErrorMessage } from '../utils/logger.util';

export interface AuthenticatedSocketData {
  userId: string;
  userEmail: string;
  userFullName: string;
  username: string;
  jwtToken: string;
}

export async function socketAuthenticationMiddleware(socket: Socket, next: (err?: Error) => void): Promise<void> {
  try {
    const jwtToken = socket.handshake.auth?.token as string | undefined;

    if (!jwtToken) {
      logSocketEvent('AUTH_FAILED', socket.id, undefined, { reason: 'No token provided' });
      return next(new Error('Authentication token is required'));
    }

    const result = verifyAndDecodeJwtToken(jwtToken);

    if (!result.isTokenValid) {
      logSocketEvent('AUTH_FAILED', socket.id, undefined, { reason: result.errorMessage });
      return next(new Error(result.errorMessage || 'Invalid token'));
    }

    const isBlacklisted = await checkIfTokenIsBlacklisted(jwtToken);
    if (isBlacklisted) {
      logSocketEvent('AUTH_FAILED', socket.id, undefined, { reason: 'Token blacklisted' });
      return next(new Error('This session has been logged out'));
    }

    const decoded = result.decodedPayload as DecodedJwtToken;
    socket.data = {
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      userFullName: decoded.userFullName,
      username: decoded.username,
      jwtToken
    };

    logSocketEvent('AUTH_SUCCESS', socket.id, decoded.userId);
    next();
  } catch (error) {
    logErrorMessage('Socket authentication error', error, { socketId: socket.id });
    next(new Error('Authentication failed'));
  }
}

export function getUserDataFromSocket(socket: Socket): AuthenticatedSocketData | null {
  return socket.data?.userId ? (socket.data as AuthenticatedSocketData) : null;
}
