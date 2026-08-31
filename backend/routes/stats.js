const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const SiteStats = require('../models/SiteStats');

/**
 * POST /api/v1/stats/visit
 * Called once per session from the frontend to increment visitor count.
 * Public — no auth required.
 */
router.post(
  '/visit',
  asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const stats = await SiteStats.findOneAndUpdate(
      { _id: 'global' },
      {
        $inc: { totalVisitors: 1 },
        $setOnInsert: { _id: 'global' }
      },
      { upsert: true, new: true }
    );

    // Increment today's daily bucket
    const dayEntry = stats.dailyVisits.find(d => d.date === today);
    if (dayEntry) {
      dayEntry.count += 1;
    } else {
      stats.dailyVisits.push({ date: today, count: 1 });
      // Keep only the last 90 days to cap document size
      if (stats.dailyVisits.length > 90) {
        stats.dailyVisits.sort((a, b) => a.date.localeCompare(b.date));
        stats.dailyVisits.splice(0, stats.dailyVisits.length - 90);
      }
    }
    await stats.save();

    res.status(200).json({ success: true, totalVisitors: stats.totalVisitors });
  })
);

/**
 * GET /api/v1/stats/visitors
 * Returns the total visitor count (and optional daily breakdown).
 * Public — displayed in the footer.
 */
router.get(
  '/visitors',
  asyncHandler(async (req, res) => {
    const stats = await SiteStats.findById('global').lean();
    res.status(200).json({
      success: true,
      totalVisitors: stats ? stats.totalVisitors : 0
    });
  })
);

module.exports = router;
