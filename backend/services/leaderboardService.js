const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const User = require('../models/User');

exports.computeLeaderboard = async (contest) => {
  const contestId = contest._id;
  const allSubs = await ContestSubmission.find({ contestId }).lean();

  // Group by userId
  const userMap = {};

  for (const sub of allSubs) {
    const uid = sub.userId.toString();
    if (!userMap[uid]) {
      userMap[uid] = {
        userId: sub.userId,
        totalPoints: 0,
        totalTimeSec: 0,
        totalPenalty: 0,
        solvedCount: 0,
        solvedProblems: [],
        problemDetails: {}
      };
    }

    const entry = userMap[uid];
    const pid = sub.problemId.toString();

    if (!entry.problemDetails[pid]) {
      entry.problemDetails[pid] = { solved: false, attempts: 0, timeSec: 0, points: 0, wrongAttempts: 0 };
    }

    const pd = entry.problemDetails[pid];
    pd.attempts += 1;

    if (sub.status === 'accepted' && !pd.solved) {
      pd.solved = true;
      pd.timeSec = sub.timeTakenSec || 0;
      pd.points = sub.points || 0;

      if (contest.scoringType === 'points') {
        entry.totalPoints += pd.points;
        entry.totalTimeSec += pd.timeSec;
      } else {
        // ICPC
        const penaltyTime = Math.floor(pd.timeSec / 60) + (pd.wrongAttempts * contest.penaltyMinutes);
        entry.totalPenalty += penaltyTime;
        entry.totalTimeSec += pd.timeSec;
      }

      entry.solvedCount += 1;
      entry.solvedProblems.push(pid);
    } else if (sub.status !== 'accepted') {
      pd.wrongAttempts += 1;
    }
  }

  // Populate user info
  const userIds = Object.keys(userMap).map(id => userMap[id].userId);
  const users = await User.find({ _id: { $in: userIds } }).select('name rollNumber batch branch').lean();
  const userInfoMap = {};
  users.forEach(u => { userInfoMap[u._id.toString()] = u; });

  // Build rows
  let rows = Object.values(userMap).map(entry => ({
    ...entry,
    user: userInfoMap[entry.userId.toString()] || null
  }));

  // Sort
  if (contest.scoringType === 'icpc') {
    rows.sort((a, b) => b.solvedCount - a.solvedCount || a.totalPenalty - b.totalPenalty);
  } else {
    rows.sort((a, b) => b.totalPoints - a.totalPoints || a.totalTimeSec - b.totalTimeSec);
  }

  // Assign ranks (handle ties)
  let rank = 1;
  rows.forEach((row, i) => {
    if (i > 0) {
      const prev = rows[i - 1];
      const samePts = row.totalPoints === prev.totalPoints;
      const sameTime = row.totalTimeSec === prev.totalTimeSec;
      const sameSolved = row.solvedCount === prev.solvedCount;
      const samePenalty = row.totalPenalty === prev.totalPenalty;

      const isTie = contest.scoringType === 'icpc'
        ? sameSolved && samePenalty
        : samePts && sameTime;

      if (!isTie) rank = i + 1;
    }
    row.rank = rank;
  });

  return rows;
};

exports.getLeaderboardEntry = async (contest, userId) => {
  const leaderboard = await exports.computeLeaderboard(contest);
  return leaderboard.find(r => r.userId.toString() === userId.toString()) || null;
};
