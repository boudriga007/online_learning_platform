const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const PROTO_PATH = path.resolve(__dirname, '../../../proto/course.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const courseProto = grpc.loadPackageDefinition(packageDef).course;
const COURSE_SERVICE = process.env.GRPC_COURSE_SERVICE || 'localhost:50052';

const client = new courseProto.CourseService(
  COURSE_SERVICE,
  grpc.credentials.createInsecure()
);

const call = (method, request) =>
  new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      if (response.error) return reject(new Error(response.error));
      resolve(response);
    });
  });

module.exports = {
  createCourse:   (data) => call('CreateCourse', data),
  getCourse:      (data) => call('GetCourse', data),
  listCourses:    (data) => call('ListCourses', data),
  updateCourse:   (data) => call('UpdateCourse', data),
  deleteCourse:   (data) => call('DeleteCourse', data),
  enrollStudent:  (data) => call('EnrollStudent', data),
  getEnrollments: (data) => call('GetEnrollments', data),
  createLesson:   (data) => call('CreateLesson', data),
  getLessons:     (data) => call('GetLessons', data),
};