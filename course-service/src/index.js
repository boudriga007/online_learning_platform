const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const handler = require('./grpc-server/handler');
const { connectProducer } = require('./kafka/producer');
const { connectConsumer } = require('./kafka/consumer');

// Load proto
const PROTO_PATH = path.resolve(__dirname, '../../proto/course.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const courseProto = grpc.loadPackageDefinition(packageDef).course;

// Create gRPC server
const server = new grpc.Server();

server.addService(courseProto.CourseService.service, {
  CreateCourse:   handler.CreateCourse,
  GetCourse:      handler.GetCourse,
  ListCourses:    handler.ListCourses,
  UpdateCourse:   handler.UpdateCourse,
  DeleteCourse:   handler.DeleteCourse,
  EnrollStudent:  handler.EnrollStudent,
  GetEnrollments: handler.GetEnrollments,
  CreateLesson:   handler.CreateLesson,
  GetLessons:     handler.GetLessons,
});

const PORT = process.env.GRPC_PORT || 50052;

const start = async () => {
  await connectProducer();
  await connectConsumer();

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('❌ Failed to start gRPC server:', err);
        process.exit(1);
      }
      console.log(`🚀 Course Service gRPC running on port ${port}`);
    }
  );
};

start();