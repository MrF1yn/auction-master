// ==============================|| SOCKET.IO CONFIGURATION ||============================== //
// Configuration options for Socket.IO server

import { ServerOptions } from 'socket.io';
import { environmentConfig } from './environment.config';

// ==============================|| SOCKET.IO SERVER OPTIONS ||============================== //
// Defines the configuration for the Socket.IO server

export const socketIoServerOptions: Partial<ServerOptions> = {
  cors: {
    origin: environmentConfig.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // 60 seconds timeout
  pingInterval: 25000, // 25 seconds interval
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024 // Only compress messages larger than 1KB
  },
  maxHttpBufferSize: 1e6 // 1MB max buffer size
};

// ==============================|| SOCKET ROOM PREFIXES ||============================== //
// Prefixes used for organizing socket rooms

export const SOCKET_ROOM_PREFIX_FOR_AUCTION = 'auction-room:';

// ==============================|| HELPER FUNCTIONS ||============================== //

export function generateAuctionRoomNameFromId(auctionItemId: string): string {
  return `${SOCKET_ROOM_PREFIX_FOR_AUCTION}${auctionItemId}`;
}

export function extractAuctionIdFromRoomName(roomName: string): string | null {
  if (roomName.startsWith(SOCKET_ROOM_PREFIX_FOR_AUCTION)) {
    return roomName.replace(SOCKET_ROOM_PREFIX_FOR_AUCTION, '');
  }
  return null;
}
