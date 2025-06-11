import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, // Prevent auto-connection
});

export default socket;
