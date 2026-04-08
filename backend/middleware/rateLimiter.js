const rateLimit = require('express-rate-limit');

// Auth: 10 attempts per 15 min (brute force protection)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Submissions: 10 per minute per user (contest-friendly)
exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, error: 'Too many submissions, please wait a moment' },
  standardHeaders: true,
  legacyHeaders: false
});

// Run code: 20 per minute per user
exports.runLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, error: 'Too many run requests, please wait' },
  standardHeaders: true,
  legacyHeaders: false
});

// General API: 1000 requests per 15 min per IP
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
