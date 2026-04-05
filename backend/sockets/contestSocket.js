const jwt = require('jsonwebtoken');

const initContestSocket = (io) => {
  io.on('connection', (socket) => {

    socket.on('contest:join', ({ contestId, token }) => {
      if (token) {
        try {
          jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          return;
        }
      }
      socket.join(`contest_${contestId}`);
      console.log(`Socket joined contest room: contest_${contestId}`);
    });

    socket.on('contest:leave', ({ contestId }) => {
      socket.leave(`contest_${contestId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

const emitLeaderboardUpdate = (io, contestId, leaderboardData) => {
  io.to(`contest_${contestId}`).emit('leaderboard:update', leaderboardData);
};

module.exports = { initContestSocket, emitLeaderboardUpdate };
