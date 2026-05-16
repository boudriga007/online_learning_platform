const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    user_id:    String
    name:       String
    email:      String
    role:       String
    created_at: String
  }

  type Course {
    course_id:   String
    title:       String
    description: String
    instructor:  String
    category:    String
    level:       String
    created_at:  String
  }

  type Lesson {
    lesson_id: String
    course_id: String
    title:     String
    content:   String
    order_num: Int
  }

  type Progress {
    user_id:           String
    course_id:         String
    percentage:        Float
    completed_lessons: [String]
    last_activity:     String
    is_completed:      Boolean
  }

  type Enrollment {
    user_id:     String
    course_id:   String
    enrolled_at: String
  }

  type Certificate {
    certificate_id: String
    user_id:        String
    course_id:      String
    issued_at:      String
    success:        Boolean
  }

  type AuthPayload {
    token:   String
    user_id: String
    role:    String
  }

  # ── Queries ──────────────────────────────
  type Query {
    # Users
    getUser(user_id: String!): User

    # Courses
    getCourse(course_id: String!): Course
    listCourses(category: String, level: String): [Course]
    getLessons(course_id: String!): [Lesson]
    getEnrollments(user_id: String!): [Enrollment]

    # Progress
    getProgress(user_id: String!, course_id: String!): Progress
    getAllProgress(user_id: String!): [Progress]
  }

  # ── Mutations ────────────────────────────
  type Mutation {
    # Auth
    register(name: String!, email: String!, password: String!, role: String): User
    login(email: String!, password: String!): AuthPayload

    # Courses
    createCourse(title: String!, description: String, category: String, level: String): Course
    enrollStudent(user_id: String!, course_id: String!): Enrollment
    createLesson(course_id: String!, title: String!, content: String, order_num: Int): Lesson

    # Progress
    completeLesson(user_id: String!, course_id: String!, lesson_id: String!): Progress
    updateProgress(user_id: String!, course_id: String!, percentage: Float!): Progress
    generateCertificate(user_id: String!, course_id: String!): Certificate
  }
`;

module.exports = { typeDefs };