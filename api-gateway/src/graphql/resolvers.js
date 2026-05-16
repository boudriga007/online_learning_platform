const userClient    = require('../grpc-clients/user.client');
const courseClient  = require('../grpc-clients/course.client');
const progressClient = require('../grpc-clients/progress.client');

const resolvers = {
  Query: {
    // ── Users ─────────────────────────────
    getUser: async (_, { user_id }) => {
      return await userClient.getUser({ user_id });
    },

    // ── Courses ───────────────────────────
    getCourse: async (_, { course_id }) => {
      return await courseClient.getCourse({ course_id });
    },

    listCourses: async (_, { category, level }) => {
      const result = await courseClient.listCourses({
        category: category || '',
        level:    level    || '',
      });
      return result.courses;
    },

    getLessons: async (_, { course_id }) => {
      const result = await courseClient.getLessons({ course_id });
      return result.lessons;
    },

    getEnrollments: async (_, { user_id }) => {
      const result = await courseClient.getEnrollments({ user_id });
      return result.enrollments;
    },

    // ── Progress ──────────────────────────
    getProgress: async (_, { user_id, course_id }) => {
      return await progressClient.getProgress({ user_id, course_id });
    },

    getAllProgress: async (_, { user_id }) => {
      const result = await progressClient.getAllProgress({ user_id });
      return result.progress_list;
    },
  },

  Mutation: {
    // ── Auth ──────────────────────────────
    register: async (_, { name, email, password, role }) => {
      return await userClient.registerUser({ name, email, password, role: role || 'student' });
    },

    login: async (_, { email, password }) => {
      return await userClient.loginUser({ email, password });
    },

    // ── Courses ───────────────────────────
    createCourse: async (_, { title, description, category, level }, context) => {
      const instructor = context.userId || 'anonymous';
      return await courseClient.createCourse({ title, description, instructor, category, level });
    },

    enrollStudent: async (_, { user_id, course_id }) => {
      const result = await courseClient.enrollStudent({ user_id, course_id });
      return { user_id, course_id, enrolled_at: result.enrolled_at };
    },

    createLesson: async (_, { course_id, title, content, order_num }) => {
      return await courseClient.createLesson({ course_id, title, content, order_num: order_num || 0 });
    },

    // ── Progress ──────────────────────────
    completeLesson: async (_, { user_id, course_id, lesson_id }) => {
      return await progressClient.completeLesson({ user_id, course_id, lesson_id });
    },

    updateProgress: async (_, { user_id, course_id, percentage }) => {
      return await progressClient.updateProgress({ user_id, course_id, percentage });
    },

    generateCertificate: async (_, { user_id, course_id }) => {
      return await progressClient.generateCertificate({ user_id, course_id });
    },
  },
};

module.exports = { resolvers };