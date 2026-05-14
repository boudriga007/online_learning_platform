const express = require('express');
const router = express.Router();
const courseClient = require('../../grpc-clients/course.client');
const { authMiddleware } = require('../middleware');

// GET /courses  — list with optional filters ?category=&level=
router.get('/', async (req, res) => {
  try {
    const { category, level } = req.query;
    const result = await courseClient.listCourses({ category: category || '', level: level || '' });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /courses/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await courseClient.getCourse({ course_id: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /courses
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    const result = await courseClient.createCourse({
      title,
      description,
      instructor: req.user.userId,
      category,
      level,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /courses/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    const result = await courseClient.updateCourse({
      course_id: req.params.id,
      title,
      description,
      category,
      level,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /courses/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await courseClient.deleteCourse({ course_id: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /courses/:id/enroll
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const result = await courseClient.enrollStudent({
      user_id:   req.user.userId,
      course_id: req.params.id,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /courses/:id/lessons
router.get('/:id/lessons', async (req, res) => {
  try {
    const result = await courseClient.getLessons({ course_id: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /courses/:id/lessons
router.post('/:id/lessons', authMiddleware, async (req, res) => {
  try {
    const { title, content, order_num } = req.body;
    const result = await courseClient.createLesson({
      course_id: req.params.id,
      title,
      content,
      order_num,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;