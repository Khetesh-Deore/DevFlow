const express = require('express');
const router = express.Router();

const {
  getUserProfile, getGlobalLeaderboard, updateProfile, changePassword,
  getAdminStats, getAllUsers, changeUserRole
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/leaderboard', getGlobalLeaderboard);
router.get('/:username', getUserProfile);

// Protected
router.put('/me', protect, updateProfile);
router.put('/me/password', protect, changePassword);

// Admin
router.get('/admin/stats', protect, authorize('admin', 'superadmin'), getAdminStats);
router.get('/', protect, authorize('admin', 'superadmin'), getAllUsers);
router.patch('/:id/role', protect, authorize('superadmin'), changeUserRole);

module.exports = router;
