const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"DevFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}: ${err.message}`);
    throw err;
  }
};

// ─── Templates ───────────────────────────────────────────────────────────────

const base = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚡ DevFlow</h1>
          <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">College Competitive Programming Platform</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;color:#64748b;font-size:12px;">© DevFlow · College Coding Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (text, url, color = '#1d4ed8') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0;">${text}</a>`;

const welcomeEmail = (userName) => base(`
  <h2 style="color:#f1f5f9;margin:0 0 8px;">Welcome, ${userName}! 🎉</h2>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
    Your DevFlow account has been created successfully.<br>
    Start solving problems, compete in contests, and climb the leaderboard!
  </p>
  ${btn('Start Solving Problems', process.env.CLIENT_URL + '/problems')}
  <p style="color:#64748b;font-size:12px;margin:20px 0 0;">
    If you didn't create this account, please ignore this email.
  </p>
`);

const passwordResetEmail = (userName, resetUrl) => base(`
  <h2 style="color:#f1f5f9;margin:0 0 8px;">Password Reset Request</h2>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;">Hi ${userName},</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
    You requested a password reset for your DevFlow account.<br>
    Click the button below to set a new password.
  </p>
  ${btn('Reset Password', resetUrl, '#dc2626')}
  <p style="color:#64748b;font-size:12px;margin:20px 0 0;">
    ⏰ This link expires in <strong style="color:#f87171;">1 hour</strong>.<br>
    If you didn't request this, you can safely ignore this email.
  </p>
`);

const contestReminderEmail = (userName, contestTitle, startTime) => base(`
  <h2 style="color:#f1f5f9;margin:0 0 8px;">Contest Starting Soon! ⏰</h2>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;">Hi ${userName},</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 4px;">
    Don't forget — your contest starts in <strong style="color:#fbbf24;">30 minutes</strong>!
  </p>
  <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0;color:#fbbf24;font-size:16px;font-weight:700;">🏆 ${contestTitle}</p>
    <p style="margin:6px 0 0;color:#64748b;font-size:13px;">Starts at: ${new Date(startTime).toLocaleString()}</p>
  </div>
  ${btn('Join Contest', process.env.CLIENT_URL + '/contests', '#16a34a')}
  <p style="color:#64748b;font-size:12px;margin:20px 0 0;">
    Make sure you're registered and ready to go!
  </p>
`);

// ─── Exported functions ───────────────────────────────────────────────────────

exports.sendEmail = sendEmail;

exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to DevFlow! 🎉',
    html: welcomeEmail(user.name)
  });
};

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'DevFlow — Password Reset Request',
    html: passwordResetEmail(user.name, resetUrl)
  });
};

exports.sendContestReminderEmail = async (user, contestTitle, startTime) => {
  await sendEmail({
    to: user.email,
    subject: `Reminder: ${contestTitle} starts in 30 minutes!`,
    html: contestReminderEmail(user.name, contestTitle, startTime)
  });
};
