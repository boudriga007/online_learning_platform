const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBQueryBuilderPlugin } = require('rxdb/plugins/query-builder');
const path = require('path');
require('dotenv').config();

addRxPlugin(RxDBQueryBuilderPlugin);

// Schema for progress collection
const progressSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                { type: 'string', maxLength: 100 },
    user_id:           { type: 'string' },
    course_id:         { type: 'string' },
    percentage:        { type: 'number', minimum: 0, maximum: 100 },
    completed_lessons: { type: 'array', items: { type: 'string' } },
    last_activity:     { type: 'string' },
    is_completed:      { type: 'boolean' },
  },
  required: ['id', 'user_id', 'course_id'],
};

// Schema for certificates collection
const certificateSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:         { type: 'string', maxLength: 100 },
    user_id:    { type: 'string' },
    course_id:  { type: 'string' },
    issued_at:  { type: 'string' },
  },
  required: ['id', 'user_id', 'course_id'],
};

let db = null;

const initDatabase = async () => {
  db = await createRxDatabase({
    name: 'progress_db',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });

  await db.addCollections({
    progress:     { schema: progressSchema },
    certificates: { schema: certificateSchema },
  });

  console.log('✅ RxDB Database initialized (progress-service)');
  return db;
};

const getDb = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

module.exports = { initDatabase, getDb };