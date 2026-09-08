import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let globalSocket = null;

export const useSocket = () => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(globalSocket?.connected || false);
  const [, setRerender] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setConnected(false);
      }
      return;
    }

    // Connect or reuse singleton socket connection with current token
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      globalSocket.on('connect', () => {
        setConnected(true);
      });

      globalSocket.on('disconnect', () => {
        setConnected(false);
      });

      globalSocket.on('connect_error', () => {
        setConnected(false);
      });
    } else if (globalSocket.auth?.token !== token) {
      // Update token if changed
      globalSocket.auth = { token };
      if (!globalSocket.connected) {
        globalSocket.connect();
      }
    }

    setConnected(globalSocket.connected);
    setRerender((r) => r + 1);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);

    return () => {
      if (globalSocket) {
        globalSocket.off('connect', onConnect);
        globalSocket.off('disconnect', onDisconnect);
      }
    };
  }, [isAuthenticated, token]);

  return { socket: globalSocket, connected };
};

export default useSocket;
