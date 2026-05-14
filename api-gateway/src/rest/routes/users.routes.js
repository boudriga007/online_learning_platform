const express = require('express');
const router = express.Router();
const userClient = require('../../grpc-clients/user.client');
const { authMiddleware } = require('../middleware');

// GET /users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await userClient.getUser({ user_id: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PUT /users/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await userClient.updateUser({
      user_id: req.params.id,
      name,
      email,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /users/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await userClient.deleteUser({ user_id: req.params.id });
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;