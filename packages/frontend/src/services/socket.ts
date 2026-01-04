/**
 * Socket.IO client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@workforce/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;
