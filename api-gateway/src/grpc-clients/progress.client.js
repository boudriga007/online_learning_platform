const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const PROTO_PATH = path.resolve(__dirname, '../../../proto/progress.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const progressProto = grpc.loadPackageDefinition(packageDef).progress;
const PROGRESS_SERVICE = process.env.GRPC_PROGRESS_SERVICE || 'localhost:50053';

const client = new progressProto.ProgressService(
  PROGRESS_SERVICE,
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
  initProgress:        (data) => call('InitProgress', data),
  updateProgress:      (data) => call('UpdateProgress', data),
  getProgress:         (data) => call('GetProgress', data),
  getAllProgress:       (data) => call('GetAllProgress', data),
  completeLesson:      (data) => call('CompleteLesson', data),
  generateCertificate: (data) => call('GenerateCertificate', data),
};