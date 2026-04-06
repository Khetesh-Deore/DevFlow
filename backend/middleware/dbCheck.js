const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database connecting, please retry in a few seconds'
    });
  }
  next();
};
