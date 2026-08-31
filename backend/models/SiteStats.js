const mongoose = require('mongoose');

// Single-document model — we store one global stats document
const siteStatsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    totalVisitors: { type: Number, default: 0 },
    // Daily breakdown: { date: "2026-08-31", count: 42 }
    dailyVisits: [
      {
        date:  { type: String, index: true }, // "YYYY-MM-DD"
        count: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteStats', siteStatsSchema);
