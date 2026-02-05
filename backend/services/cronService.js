const cron = require('node-cron');
const Contest = require('../models/Contest');

const checkScheduledContests = async () => {
  try {
    const now = new Date();
    const contests = await Contest.find({
      status: 'scheduled',
      startTime: { $lte: now }
    });

    for (const contest of contests) {
      contest.status = 'live';
      await contest.save();

      console.log(`Contest started: ${contest.title} (${contest._id})`);

      if (global.io) {
        global.io.emit('contest-started', {
          contestId: contest._id,
          title: contest.title,
          customUrl: contest.customUrl
        });

        contest.participants.forEach(participant => {
          global.io.to(`user-${participant.userId}`).emit('contest-notification', {
            type: 'started',
            contestId: contest._id,
            title: contest.title,
            message: `Contest "${contest.title}" has started!`
          });
        });
      }
    }
  } catch (error) {
    console.error('Error checking scheduled contests:', error);
  }
};

const checkLiveContests = async () => {
  try {
    const now = new Date();
    const contests = await Contest.find({
      status: 'live',
      endTime: { $lte: now }
    });

    for (const contest of contests) {
      contest.status = 'ended';
      await contest.save();

      console.log(`Contest ended: ${contest.title} (${contest._id})`);

      if (global.io) {
        global.io.to(`contest-${contest._id}`).emit('contest-ended', {
          contestId: contest._id,
          title: contest.title
        });

        contest.participants.forEach(participant => {
          global.io.to(`user-${participant.userId}`).emit('contest-notification', {
            type: 'ended',
            contestId: contest._id,
            title: contest.title,
            message: `Contest "${contest.title}" has ended!`
          });
        });
      }
    }
  } catch (error) {
    console.error('Error checking live contests:', error);
  }
};

const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    await checkScheduledContests();
    await checkLiveContests();
  });

  console.log('✓ Cron jobs started');
};

module.exports = { startCronJobs, checkScheduledContests, checkLiveContests };
