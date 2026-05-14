const express = require('express');
const router = express.Router();
const progressClient = require('../../grpc-clients/progress.client');
const { authMiddleware } = require('../middleware');

// GET /progress/:userId/:courseId
router.get('/:userId/:courseId', authMiddleware, async (req, res) => {
  try {
    const result = await progressClient.getProgress({
      user_id:   req.params.userId,
      course_id: req.params.courseId,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// GET /progress/:userId  — all courses progress
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const result = await progressClient.getAllProgress({ user_id: req.params.userId });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /progress/:userId/:courseId  — update percentage
router.put('/:userId/:courseId', authMiddleware, async (req, res) => {
  try {
    const { percentage } = req.body;
    const result = await progressClient.updateProgress({
      user_id:   req.params.userId,
      course_id: req.params.courseId,
      percentage,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /progress/:userId/:courseId/complete-lesson
router.post('/:userId/:courseId/complete-lesson', authMiddleware, async (req, res) => {
  try {
    const { lesson_id } = req.body;
    const result = await progressClient.completeLesson({
      user_id:   req.params.userId,
      course_id: req.params.courseId,
      lesson_id,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /progress/:userId/:courseId/certificate
router.post('/:userId/:courseId/certificate', authMiddleware, async (req, res) => {
  try {
    const result = await progressClient.generateCertificate({
      user_id:   req.params.userId,
      course_id: req.params.courseId,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;