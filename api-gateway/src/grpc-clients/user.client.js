const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const PROTO_PATH = path.resolve(__dirname, '../../../proto/user.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDef).user;
const USER_SERVICE = process.env.GRPC_USER_SERVICE || 'localhost:50051';

const client = new userProto.UserService(
  USER_SERVICE,
  grpc.credentials.createInsecure()
);

// Promisify gRPC calls
const call = (method, request) =>
  new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      if (response.error) return reject(new Error(response.error));
      resolve(response);
    });
  });

module.exports = {
  registerUser:  (data) => call('RegisterUser', data),
  loginUser:     (data) => call('LoginUser', data),
  getUser:       (data) => call('GetUser', data),
  updateUser:    (data) => call('UpdateUser', data),
  deleteUser:    (data) => call('DeleteUser', data),
  validateToken: (data) => call('ValidateToken', data),
};