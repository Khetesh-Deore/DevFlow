import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(SOCKET_URL, { autoConnect: false });
    this.socket.connect();
  }

  disconnect() {
    this.socket?.disconnect();
  }

  onSubmissionResult(callback: (data: any) => void) {
    this.socket?.on('submission:result', callback);
  }

  onLeaderboardUpdate(callback: (data: any) => void) {
    this.socket?.on('leaderboard:update', callback);
  }

  onContestStart(callback: (data: any) => void) {
    this.socket?.on('contest:start', callback);
  }

  onContestEnd(callback: (data: any) => void) {
    this.socket?.on('contest:end', callback);
  }

  joinContest(contestId: string) {
    this.socket?.emit('contest:join', { contestId });
  }

  leaveContest(contestId: string) {
    this.socket?.emit('contest:leave', { contestId });
  }
}

export const socketService = new SocketService();
