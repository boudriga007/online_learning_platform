const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'course-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'course-service-group' });

const connectConsumer = async () => {
  await consumer.connect();

  // Listen to lesson.completed → update course stats
  await consumer.subscribe({ topic: 'lesson.completed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`📥 Event received ← topic: ${topic}`, data);

      if (topic === 'lesson.completed') {
        handleLessonCompleted(data);
      }
    },
  });

  console.log('✅ Kafka Consumer connected (course-service)');
};

const handleLessonCompleted = (data) => {
  // Log lesson completion for course statistics
  // In a real app, you could update a course stats table here
  console.log(`📊 Lesson ${data.lessonId} completed by user ${data.userId} in course ${data.courseId}`);
};

module.exports = { connectConsumer };