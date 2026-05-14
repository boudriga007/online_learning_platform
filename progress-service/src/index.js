const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./db/database');
const handler = require('./grpc-server/handler');
const { connectProducer } = require('./kafka/producer');
const { connectConsumer } = require('./kafka/consumer');

// Load proto
const PROTO_PATH = path.resolve(__dirname, '../../proto/progress.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const progressProto = grpc.loadPackageDefinition(packageDef).progress;

// Create gRPC server
const server = new grpc.Server();

server.addService(progressProto.ProgressService.service, {
  InitProgress:        handler.InitProgress,
  UpdateProgress:      handler.UpdateProgress,
  GetProgress:         handler.GetProgress,
  GetAllProgress:      handler.GetAllProgress,
  CompleteLesson:      handler.CompleteLesson,
  GenerateCertificate: handler.GenerateCertificate,
});

const PORT = process.env.GRPC_PORT || 50053;

const start = async () => {
  // Init RxDB first
  const db = await initDatabase();

  // Connect Kafka
  await connectProducer();
  await connectConsumer(db);

  // Start gRPC server
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('❌ Failed to start gRPC server:', err);
        process.exit(1);
      }
      console.log(`🚀 Progress Service gRPC running on port ${port}`);
    }
  );
};

start();