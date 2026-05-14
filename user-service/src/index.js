const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const handler = require('./grpc-server/handler');
const { connectProducer } = require('./kafka/producer');

// Load proto
const PROTO_PATH = path.resolve(__dirname, '../../proto/user.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDef).user;

// Create gRPC server
const server = new grpc.Server();

server.addService(userProto.UserService.service, {
  RegisterUser: handler.RegisterUser,
  LoginUser:    handler.LoginUser,
  GetUser:      handler.GetUser,
  UpdateUser:   handler.UpdateUser,
  DeleteUser:   handler.DeleteUser,
  ValidateToken: handler.ValidateToken,
});

const PORT = process.env.GRPC_PORT || 50051;

const start = async () => {
  // Connect Kafka producer
  await connectProducer();

  // Start gRPC server
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('❌ Failed to start gRPC server:', err);
        process.exit(1);
      }
      console.log(`🚀 User Service gRPC running on port ${port}`);
    }
  );
};

start();