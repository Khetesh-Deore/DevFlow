const Queue = require('bull');
const axios = require('axios');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');

const submissionQueue = new Queue('submissions', process.env.REDIS_URL || 'redis://localhost:6379');

submissionQueue.process(async (job) => {
  const { submissionId, code, language, testCases, limits, points, contestId, userId, problemId } = job.data;

  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new Error('Submission not found');

    submission.status = 'running';
    await submission.save();

    const sandboxUrl = process.env.SANDBOX_URL || 'http://localhost:3001';
    const response = await axios.post(`${sandboxUrl}/run`, {
      language,
      code,
      testcases: testCases.map(tc => ({
        input: tc.input,
        expected_output: tc.output
      })),
      constraints: {
        timeLimit: (limits?.timeLimit || 2) * 1000,
        memoryLimit: limits?.memoryLimit || 256
      }
    }, {
      timeout: 60000
    });

    const result = response.data;
    
    submission.status = result.status;
    submission.testCasesPassed = result.passed || 0;
    submission.totalTestCases = result.total || testCases.length;
    submission.executionTime = result.runtime_ms || 0;
    submission.memoryUsed = result.memory_mb || 0;
    submission.completedAt = new Date();

    if (result.details && Array.isArray(result.details)) {
      submission.testCaseResults = result.details.map((detail, idx) => ({
        testCaseId: testCases[idx]?._id,
        passed: detail.passed || false,
        executionTime: detail.time || 0,
        memoryUsed: detail.memory || 0,
        output: detail.stdout,
        expectedOutput: detail.expected,
        error: detail.stderr || detail.error
      }));
    }

    if (result.status === 'AC') {
      submission.score = points;
      submission.verdict = 'accepted';
    } else {
      submission.score = Math.floor((result.passed / result.total) * points);
      submission.verdict = result.status.toLowerCase();
    }

    await submission.save();

    await updateContestParticipant(contestId, userId, problemId, submission);
    await updateProblemStats(problemId, result.status === 'AC');
    await updateUserStats(userId, result.status === 'AC');

    if (global.io) {
      global.io.to(`user-${userId}`).emit('submission-result', {
        submissionId: submission._id,
        status: submission.status,
        score: submission.score,
        testCasesPassed: submission.testCasesPassed,
        totalTestCases: submission.totalTestCases,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed
      });

      global.io.to(`contest-${contestId}`).emit('submission-update', {
        submissionId: submission._id,
        status: submission.status,
        score: submission.score
      });
    }

    return { success: true, submission };
  } catch (error) {
    console.error('Submission processing error:', error);
    
    const submission = await Submission.findById(submissionId);
    if (submission) {
      submission.status = 'RE';
      submission.verdict = 'runtime_error';
      submission.completedAt = new Date();
      await submission.save();

      if (global.io) {
        global.io.to(`user-${userId}`).emit('submission-result', {
          submissionId: submission._id,
          status: 'RE',
          error: 'Execution failed'
        });
      }
    }

    throw error;
  }
});

async function updateContestParticipant(contestId, userId, problemId, submission) {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return;

    const participantIndex = contest.participants.findIndex(
      p => p.userId.toString() === userId.toString()
    );

    if (participantIndex === -1) return;

    const participant = contest.participants[participantIndex];

    if (!participant.submissions.includes(submission._id)) {
      participant.submissions.push(submission._id);
    }

    if (submission.status === 'AC' && !participant.solvedQuestions.includes(problemId)) {
      participant.solvedQuestions.push(problemId);
      participant.score += submission.score;
    } else if (submission.status === 'AC') {
      const existingSubmissions = await Submission.find({
        contestId,
        problemId,
        userId,
        status: 'AC',
        _id: { $ne: submission._id }
      });

      if (existingSubmissions.length === 0) {
        participant.score += submission.score;
      }
    }

    await contest.save();
  } catch (error) {
    console.error('Error updating contest participant:', error);
  }
}

async function updateProblemStats(problemId, isAccepted) {
  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return;

    problem.stats.totalSubmissions += 1;
    if (isAccepted) {
      problem.stats.acceptedSubmissions += 1;
    }
    problem.updateSuccessRate();
    await problem.save();
  } catch (error) {
    console.error('Error updating problem stats:', error);
  }
}

async function updateUserStats(userId, isAccepted) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.stats.totalSubmissions += 1;
    if (isAccepted) {
      user.stats.acceptedSubmissions += 1;
    }
    await user.save();
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

submissionQueue.on('completed', (job, result) => {
  console.log(`Submission ${job.data.submissionId} completed`);
});

submissionQueue.on('failed', (job, err) => {
  console.error(`Submission ${job.data.submissionId} failed:`, err.message);
});

module.exports = {
  addSubmission: (data) => submissionQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: false,
    removeOnFail: false
  }),
  queue: submissionQueue
};
