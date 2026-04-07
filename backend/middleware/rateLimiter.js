const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, error: 'Too many submissions, please wait' },
  standardHeaders: true,
  legacyHeaders: false
});

exports.runLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, error: 'Too many run requests, please wait' },
  standardHeaders: true,
  legacyHeaders: false
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
