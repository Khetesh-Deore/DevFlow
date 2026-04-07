const cron = require('node-cron');
const Contest = require('../models/Contest');
const ContestRegistration = require('../models/ContestRegistration');
const User = require('../models/User');
const { sendContestReminderEmail } = require('./emailService');

// Track which contests we've already sent reminders for
const remindersSent = new Set();

const sendContestReminders = async () => {
  // Skip if DB not connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) return;

  try {
    const now = new Date();
    const in30min = new Date(now.getTime() + 30 * 60 * 1000);
    const in31min = new Date(now.getTime() + 31 * 60 * 1000);

    // Find contests starting in the next 30-31 minutes
    const contests = await Contest.find({
      isPublished: true,
      startTime: { $gte: in30min, $lte: in31min }
    });

    for (const contest of contests) {
      if (remindersSent.has(contest._id.toString())) continue;

      // Get all registered users
      const registrations = await ContestRegistration.find({ contestId: contest._id });
      const userIds = registrations.map(r => r.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('name email');

      let sent = 0;
      for (const user of users) {
        try {
          await sendContestReminderEmail(user, contest.title, contest.startTime);
          sent++;
        } catch (e) {
          console.error(`Reminder failed for ${user.email}: ${e.message}`);
        }
      }

      remindersSent.add(contest._id.toString());
      console.log(`📧 Sent ${sent} reminders for contest: ${contest.title}`);
    }
  } catch (err) {
    console.error('Contest reminder cron error:', err.message);
  }
};

const startContestReminderCron = () => {
  // Run every minute
  cron.schedule('* * * * *', sendContestReminders);
  console.log('⏰ Contest reminder cron started');
};

module.exports = { startContestReminderCron };
