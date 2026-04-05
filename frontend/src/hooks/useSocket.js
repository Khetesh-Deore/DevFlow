import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(contestId, onLeaderboardUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!contestId) return;
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current.emit('join:contest', contestId);
    socketRef.current.on('leaderboard:update', onLeaderboardUpdate);

    return () => {
      socketRef.current.emit('leave:contest', contestId);
      socketRef.current.disconnect();
    };
  }, [contestId]);

  return socketRef.current;
}
