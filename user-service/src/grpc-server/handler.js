const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { publishEvent } = require('../kafka/producer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ─────────────────────────────────────────
//  RegisterUser
// ─────────────────────────────────────────
const RegisterUser = async (call, callback) => {
  try {
    const { name, email, password, role } = call.request;

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return callback(null, { error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, email, hashedPassword, role || 'student');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    // Publish Kafka event
    await publishEvent('user.registered', {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    callback(null, {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      error: '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  LoginUser
// ─────────────────────────────────────────
const LoginUser = async (call, callback) => {
  try {
    const { email, password } = call.request;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return callback(null, { error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return callback(null, { error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    callback(null, { token, user_id: user.id, role: user.role, error: '' });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetUser
// ─────────────────────────────────────────
const GetUser = (call, callback) => {
  try {
    const { user_id } = call.request;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);

    if (!user) {
      return callback(null, { error: 'User not found' });
    }

    callback(null, {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      error: '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  UpdateUser
// ─────────────────────────────────────────
const UpdateUser = (call, callback) => {
  try {
    const { user_id, name, email } = call.request;

    db.prepare(`
      UPDATE users SET name = ?, email = ? WHERE id = ?
    `).run(name, email, user_id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!user) return callback(null, { error: 'User not found' });

    callback(null, {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      error: '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  DeleteUser
// ─────────────────────────────────────────
const DeleteUser = (call, callback) => {
  try {
    const { user_id } = call.request;
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(user_id);

    if (result.changes === 0) {
      return callback(null, { success: false, error: 'User not found' });
    }

    callback(null, { success: true, error: '' });
  } catch (err) {
    callback(null, { success: false, error: err.message });
  }
};

// ─────────────────────────────────────────
//  ValidateToken
// ─────────────────────────────────────────
const ValidateToken = (call, callback) => {
  try {
    const { token } = call.request;
    const decoded = jwt.verify(token, JWT_SECRET);

    callback(null, {
      valid: true,
      user_id: decoded.userId,
      role: decoded.role,
      error: '',
    });
  } catch (err) {
    callback(null, { valid: false, user_id: '', role: '', error: 'Invalid token' });
  }
};

module.exports = {
  RegisterUser,
  LoginUser,
  GetUser,
  UpdateUser,
  DeleteUser,
  ValidateToken,
};