const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'progress-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('✅ Kafka Producer connected (progress-service)');
};

const publishEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
  console.log(`📤 Event published → topic: ${topic}`, message);
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

module.exports = { connectProducer, publishEvent, disconnectProducer };