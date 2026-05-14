const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'progress-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'progress-service-group' });

let dbRef = null;

const connectConsumer = async (db) => {
  dbRef = db;
  await consumer.connect();

  // Subscribe to course.enrolled → init progress at 0%
  await consumer.subscribe({ topic: 'course.enrolled', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`📥 Event received ← topic: ${topic}`, data);

      if (topic === 'course.enrolled') {
        await handleCourseEnrolled(data);
      }
    },
  });

  console.log('✅ Kafka Consumer connected (progress-service)');
};

// When a student enrolls → create progress record at 0%
const handleCourseEnrolled = async (data) => {
  try {
    const { userId, courseId, enrolledAt } = data;
    const id = `${userId}_${courseId}`;

    const existing = await dbRef.progress.findOne({ selector: { id } }).exec();
    if (existing) return;

    await dbRef.progress.insert({
      id,
      user_id:           userId,
      course_id:         courseId,
      percentage:        0,
      completed_lessons: [],
      last_activity:     enrolledAt || new Date().toISOString(),
      is_completed:      false,
    });

    console.log(`✅ Progress initialized for user ${userId} in course ${courseId}`);
  } catch (err) {
    console.error('❌ Error handling course.enrolled:', err.message);
  }
};

module.exports = { connectConsumer };