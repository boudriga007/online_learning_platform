const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { publishEvent } = require('../kafka/producer');

// ─────────────────────────────────────────
//  CreateCourse
// ─────────────────────────────────────────
const CreateCourse = (call, callback) => {
  try {
    const { title, description, instructor, category, level } = call.request;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO courses (id, title, description, instructor, category, level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, description, instructor, category, level || 'beginner');

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);

    callback(null, {
      course_id:   course.id,
      title:       course.title,
      description: course.description,
      instructor:  course.instructor,
      category:    course.category,
      level:       course.level,
      created_at:  course.created_at,
      error:       '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetCourse
// ─────────────────────────────────────────
const GetCourse = (call, callback) => {
  try {
    const { course_id } = call.request;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);

    if (!course) return callback(null, { error: 'Course not found' });

    callback(null, {
      course_id:   course.id,
      title:       course.title,
      description: course.description,
      instructor:  course.instructor,
      category:    course.category,
      level:       course.level,
      created_at:  course.created_at,
      error:       '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  ListCourses
// ─────────────────────────────────────────
const ListCourses = (call, callback) => {
  try {
    const { category, level } = call.request;
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (level)    { query += ' AND level = ?';    params.push(level); }

    const courses = db.prepare(query).all(...params);

    callback(null, {
      courses: courses.map(c => ({
        course_id:   c.id,
        title:       c.title,
        description: c.description,
        instructor:  c.instructor,
        category:    c.category,
        level:       c.level,
        created_at:  c.created_at,
        error:       '',
      })),
      error: '',
    });
  } catch (err) {
    callback(null, { courses: [], error: err.message });
  }
};

// ─────────────────────────────────────────
//  UpdateCourse
// ─────────────────────────────────────────
const UpdateCourse = (call, callback) => {
  try {
    const { course_id, title, description, category, level } = call.request;

    db.prepare(`
      UPDATE courses SET title = ?, description = ?, category = ?, level = ?
      WHERE id = ?
    `).run(title, description, category, level, course_id);

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) return callback(null, { error: 'Course not found' });

    callback(null, {
      course_id:   course.id,
      title:       course.title,
      description: course.description,
      instructor:  course.instructor,
      category:    course.category,
      level:       course.level,
      created_at:  course.created_at,
      error:       '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  DeleteCourse
// ─────────────────────────────────────────
const DeleteCourse = (call, callback) => {
  try {
    const { course_id } = call.request;
    const result = db.prepare('DELETE FROM courses WHERE id = ?').run(course_id);

    if (result.changes === 0) {
      return callback(null, { success: false, error: 'Course not found' });
    }
    callback(null, { success: true, error: '' });
  } catch (err) {
    callback(null, { success: false, error: err.message });
  }
};

// ─────────────────────────────────────────
//  EnrollStudent
// ─────────────────────────────────────────
const EnrollStudent = async (call, callback) => {
  try {
    const { user_id, course_id } = call.request;

    // Check course exists
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) return callback(null, { success: false, error: 'Course not found' });

    // Check already enrolled
    const existing = db.prepare(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?'
    ).get(user_id, course_id);
    if (existing) return callback(null, { success: false, error: 'Already enrolled' });

    db.prepare(`
      INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)
    `).run(user_id, course_id);

    const enrollment = db.prepare(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?'
    ).get(user_id, course_id);

    // Publish Kafka event
    await publishEvent('course.enrolled', {
      userId:     user_id,
      courseId:   course_id,
      enrolledAt: enrollment.enrolled_at,
    });

    callback(null, {
      success:     true,
      user_id,
      course_id,
      enrolled_at: enrollment.enrolled_at,
      error:       '',
    });
  } catch (err) {
    callback(null, { success: false, error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetEnrollments
// ─────────────────────────────────────────
const GetEnrollments = (call, callback) => {
  try {
    const { user_id } = call.request;
    const enrollments = db.prepare(
      'SELECT * FROM enrollments WHERE user_id = ?'
    ).all(user_id);

    callback(null, {
      enrollments: enrollments.map(e => ({
        success:     true,
        user_id:     e.user_id,
        course_id:   e.course_id,
        enrolled_at: e.enrolled_at,
        error:       '',
      })),
      error: '',
    });
  } catch (err) {
    callback(null, { enrollments: [], error: err.message });
  }
};

// ─────────────────────────────────────────
//  CreateLesson
// ─────────────────────────────────────────
const CreateLesson = (call, callback) => {
  try {
    const { course_id, title, content, order_num } = call.request;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO lessons (id, course_id, title, content, order_num)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, course_id, title, content, order_num || 0);

    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(id);

    callback(null, {
      lesson_id: lesson.id,
      course_id: lesson.course_id,
      title:     lesson.title,
      content:   lesson.content,
      order_num: lesson.order_num,
      error:     '',
    });
  } catch (err) {
    callback(null, { error: err.message });
  }
};

// ─────────────────────────────────────────
//  GetLessons
// ─────────────────────────────────────────
const GetLessons = (call, callback) => {
  try {
    const { course_id } = call.request;
    const lessons = db.prepare(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_num'
    ).all(course_id);

    callback(null, {
      lessons: lessons.map(l => ({
        lesson_id: l.id,
        course_id: l.course_id,
        title:     l.title,
        content:   l.content,
        order_num: l.order_num,
        error:     '',
      })),
      error: '',
    });
  } catch (err) {
    callback(null, { lessons: [], error: err.message });
  }
};

module.exports = {
  CreateCourse,
  GetCourse,
  ListCourses,
  UpdateCourse,
  DeleteCourse,
  EnrollStudent,
  GetEnrollments,
  CreateLesson,
  GetLessons,
};