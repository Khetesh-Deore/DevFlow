const rateLimit = require('express-rate-limit');

/**
 * Key generator helpers
 * ─────────────────────
 * COLLEGE CONTEXT: many students share the same public IP (NAT).
 * Keying by IP on auth routes would lock out an entire lab when one
 * student exhausts the limit.
 *
 * Best-practice approach by route type:
 *
 *   Auth (pre-login)  → key by the submitted identifier (email or
 *                        rollNumber from req.body), normalised to
 *                        lowercase. Falls back to req.ip only when
 *                        no identifier is present (e.g. blank POST).
 *
 *   Authenticated     → key by req.user.id (set by the protect
 *                        middleware), never by IP.
 *
 *   Public/general    → key by IP, but with a generous limit so a
 *                        shared NAT gateway is not hammered.
 */

/**
 * For /login and /forgot-password: track by submitted email address.
 * Normalise to lowercase so "User@EXAMPLE.com" and "user@example.com"
 * count against the same bucket.
 */
function authKeyGenerator(req) {
  const identifier =
    (req.body?.email || req.body?.rollNumber || '')
      .toString()
      .toLowerCase()
      .trim();

  // If someone POSTs without an identifier, fall back to IP —
  // they will hit the limit immediately (empty attempt) which is fine.
  return identifier || req.ip;
}

/**
 * For routes that require a logged-in user (submissions, run-code).
 * req.user is populated by the `protect` middleware before the limiter
 * runs. We should never fall back to IP here; if req.user is missing
 * the route itself will 401 before the limiter matters.
 */
function userKeyGenerator(req) {
  return req.user?.id || req.ip; // req.user.id is a MongoDB ObjectId string
}

// ─── Auth limiter ────────────────────────────────────────────────
// 10 failed attempts per 15 min, keyed per email address.
// One student failing 10 times does NOT affect any other student.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // 15 minutes
  max: 10,
  keyGenerator: authKeyGenerator,
  skipSuccessfulRequests: true,    // only count failures toward the limit
  message: {
    success: false,
    error: 'Too many failed attempts for this account. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Submission limiter ──────────────────────────────────────────
// 15 submissions per minute, keyed per user ID.
exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,            // 1 minute
  max: 15,
  keyGenerator: userKeyGenerator,
  message: {
    success: false,
    error: 'Too many submissions. Please wait a moment before submitting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Run-code limiter ────────────────────────────────────────────
// 30 run-code requests per minute, keyed per user ID.
exports.runLimiter = rateLimit({
  windowMs: 60 * 1000,            // 1 minute
  max: 30,
  keyGenerator: userKeyGenerator,
  message: {
    success: false,
    error: 'Too many run requests. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── General API limiter ─────────────────────────────────────────
// Last line of defence against bots / scrapers.
// Keyed by IP, but limit is generous enough for a full lab:
// 2000 req / 15 min ≈ 133 req/min, comfortable for 30+ students
// sharing one NAT IP.
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,       // 15 minutes
  max: 2000,
  message: {
    success: false,
    error: 'Too many requests from this network. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
