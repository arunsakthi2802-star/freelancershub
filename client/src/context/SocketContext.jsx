import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('user:online', user._id);
        console.log('🔌 Socket connected');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('🔌 Socket disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket error:', err.message);
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const joinRoom = (roomId) => socketRef.current?.emit('chat:join', roomId);
  const leaveRoom = (roomId) => socketRef.current?.emit('chat:leave', roomId);
  const sendMessage = (data) => socketRef.current?.emit('chat:message', data);
  const sendTyping = (data) => socketRef.current?.emit('chat:typing', data);
  const markRead = (data) => socketRef.current?.emit('chat:read', data);
  const on = (event, cb) => { socketRef.current?.on(event, cb); return () => socketRef.current?.off(event, cb); };
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, joinRoom, leaveRoom, sendMessage, sendTyping, markRead, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
