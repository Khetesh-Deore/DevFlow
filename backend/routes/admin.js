const express = require('express');
const router = express.Router();

const {
  getStats, getAdminProblems, getUsers, updateUserRole, getAllSubmissions
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'superadmin'));

router.get('/stats', getStats);
router.get('/problems', getAdminProblems);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/submissions', getAllSubmissions);

module.exports = router;
