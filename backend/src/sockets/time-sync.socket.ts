// NTP-style time synchronization between client and server

import { Socket } from 'socket.io';
import {
  SOCKET_EVENT_CLIENT_TIME_SYNC_REQUEST,
  SOCKET_EVENT_SERVER_TIME_SYNC_RESPONSE,
  TimeSyncRequestPayload,
  TimeSyncResponsePayload
} from '../constants/socket-events.constants';
import { logSocketEvent } from '../utils/logger.util';

export function registerTimeSyncHandlers(socket: Socket): void {
  socket.on(SOCKET_EVENT_CLIENT_TIME_SYNC_REQUEST, (payload: TimeSyncRequestPayload) => {
    handleTimeSyncRequest(socket, payload);
  });
}

// NTP algorithm: client calculates offset = ((t1 - t0) + (t2 - t3)) / 2
function handleTimeSyncRequest(socket: Socket, payload: TimeSyncRequestPayload): void {
  const serverT1 = Date.now();

  const response: TimeSyncResponsePayload = {
    clientTimestampT0InMs: payload.clientTimestampT0InMs,
    serverTimestampT1InMs: serverT1,
    serverTimestampT2InMs: Date.now()
  };

  socket.emit(SOCKET_EVENT_SERVER_TIME_SYNC_RESPONSE, response);
  logSocketEvent('TIME_SYNC', socket.id, socket.data?.userId, { clientT0: payload.clientTimestampT0InMs, serverT1 });
}
