const express = require('express');
const router = express.Router();
const {
  createContest,
  getAllContests,
  getContestById,
  getContestByUrl,
  updateContest,
  deleteContest,
  registerForContest,
  unregisterFromContest,
  addProblemToContest,
  removeProblemFromContest,
  getContestProblems,
  getContestParticipants,
  publishContest,
  endContest
} = require('../controllers/contestController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createContest);
router.get('/', protect, getAllContests);
router.get('/url/:customUrl', protect, getContestByUrl);
router.get('/:id', protect, getContestById);
router.put('/:id', protect, authorize('admin'), updateContest);
router.delete('/:id', protect, authorize('admin'), deleteContest);

router.post('/:id/register', protect, registerForContest);
router.post('/:id/unregister', protect, unregisterFromContest);

router.post('/:id/problems', protect, authorize('admin'), addProblemToContest);
router.delete('/:id/problems/:problemId', protect, authorize('admin'), removeProblemFromContest);
router.get('/:id/problems', protect, getContestProblems);

router.get('/:id/participants', protect, getContestParticipants);

router.post('/:id/publish', protect, authorize('admin'), publishContest);
router.post('/:id/end', protect, authorize('admin'), endContest);

module.exports = router;
