const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './src/db/courses.db';
const db = new Database(path.resolve(DB_PATH));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    instructor  TEXT NOT NULL,
    category    TEXT,
    level       TEXT DEFAULT 'beginner',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id        TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title     TEXT NOT NULL,
    content   TEXT,
    order_num INTEGER DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    user_id     TEXT NOT NULL,
    course_id   TEXT NOT NULL,
    enrolled_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, course_id)
  );
`);

console.log('✅ SQLite3 Database initialized (course-service)');

module.exports = db;