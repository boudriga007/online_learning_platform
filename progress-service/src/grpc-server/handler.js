const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { publishEvent } = require('../kafka/producer');

// ─────────────────────────────────────────
//  InitProgress
// ─────────────────────────────────────────
const InitProgress = async (call, callback) => {
  try {
    const { user_id, course_id } = call.request;
    const db = getDb();
    const id = `${user_id}_${course_id}`;

    const existing = await db.progress.findOne({ selector: { id } }).exec();
    if (existing) {
      return callback(null, {
        user_id,
        course_id,
        percentage:         existing.percentage,
        completed_lessons:  existing.completed_lessons,
        last_activity:      existing.last_activity,
        is_completed:       existing.is_completed,
        error:              'Progress already exists',
      });
    }

    await db.progress.insert({
      id,
      user_id,
      course_id,
      percentage:        0,
      completed_lessons: [],
      last_activity:     new Date().toISOString(),
      is_completed:      false,
    });

    callback(null, {
      user_id,
      course_id,
      percentage:        0,
      completed_lessons: [],
      last_activity:     new Date().toISOString(),
      is_completed:      false,
      error:             '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  UpdateProgress
// ─────────────────────────────────────────
const UpdateProgress = async (call, callback) => {
  try {
    const { user_id, course_id, percentage } = call.request;
    const db = getDb();
    const id = `${user_id}_${course_id}`;

    const record = await db.progress.findOne({ selector: { id } }).exec();
    if (!record) return callback(null, { error: 'Progress not found' });

    const isCompleted = percentage >= 100;
    await record.patch({
      percentage,
      is_completed:  isCompleted,
      last_activity: new Date().toISOString(),
    });

    callback(null, {
      user_id,
      course_id,
      percentage,
      completed_lessons: record.completed_lessons,
      last_activity:     new Date().toISOString(),
      is_completed:      isCompleted,
      error:             '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetProgress
// ─────────────────────────────────────────
const GetProgress = async (call, callback) => {
  try {
    const { user_id, course_id } = call.request;
    const db = getDb();
    const id = `${user_id}_${course_id}`;

    const record = await db.progress.findOne({ selector: { id } }).exec();
    if (!record) return callback(null, { error: 'Progress not found' });

    callback(null, {
      user_id:           record.user_id,
      course_id:         record.course_id,
      percentage:        record.percentage,
      completed_lessons: record.completed_lessons,
      last_activity:     record.last_activity,
      is_completed:      record.is_completed,
      error:             '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetAllProgress
// ─────────────────────────────────────────
const GetAllProgress = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const db = getDb();

    const records = await db.progress.find({ selector: { user_id } }).exec();

    callback(null, {
      progress_list: records.map(r => ({
        user_id:           r.user_id,
        course_id:         r.course_id,
        percentage:        r.percentage,
        completed_lessons: r.completed_lessons,
        last_activity:     r.last_activity,
        is_completed:      r.is_completed,
        error:             '',
      })),
      error: '',
    });
  } catch (err) {
    callback(null, { progress_list: [], error: err.message });
  }
};

// ─────────────────────────────────────────
//  CompleteLesson
// ─────────────────────────────────────────
const CompleteLesson = async (call, callback) => {
  try {
    const { user_id, course_id, lesson_id } = call.request;
    const db = getDb();
    const id = `${user_id}_${course_id}`;

    const record = await db.progress.findOne({ selector: { id } }).exec();
    if (!record) return callback(null, { error: 'Progress not found' });

    // Add lesson if not already completed
    const completed = record.completed_lessons || [];
    if (!completed.includes(lesson_id)) {
      completed.push(lesson_id);
    }

    await record.patch({
      completed_lessons: completed,
      last_activity:     new Date().toISOString(),
    });

    // Publish Kafka event → course-service updates stats
    await publishEvent('lesson.completed', {
      userId:    user_id,
      courseId:  course_id,
      lessonId:  lesson_id,
      completedAt: new Date().toISOString(),
    });

    callback(null, {
      user_id,
      course_id,
      percentage:        record.percentage,
      completed_lessons: completed,
      last_activity:     new Date().toISOString(),
      is_completed:      record.is_completed,
      error:             '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GenerateCertificate
// ─────────────────────────────────────────
const GenerateCertificate = async (call, callback) => {
  try {
    const { user_id, course_id } = call.request;
    const db = getDb();
    const id = `${user_id}_${course_id}`;

    const record = await db.progress.findOne({ selector: { id } }).exec();
    if (!record) return callback(null, { success: false, error: 'Progress not found' });
    if (record.percentage < 100) {
      return callback(null, {
        success: false,
        error:   'Course not completed yet. Reach 100% to get certificate.',
      });
    }

    const certId = uuidv4();
    const issuedAt = new Date().toISOString();

    await db.certificates.insert({
      id:        certId,
      user_id,
      course_id,
      issued_at: issuedAt,
    });

    callback(null, {
      certificate_id: certId,
      user_id,
      course_id,
      issued_at:      issuedAt,
      success:        true,
      error:          '',
    });
  } catch (err) {
    callback(null, { success: false, error: err.message });
  }
};

module.exports = {
  InitProgress,
  UpdateProgress,
  GetProgress,
  GetAllProgress,
  CompleteLesson,
  GenerateCertificate,
};