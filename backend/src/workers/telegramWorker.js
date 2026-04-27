require('dotenv').config();
const notificationQueue = require('../services/notificationQueue');
const cron = require('node-cron');
const pool = require('../config/database');

console.log('Telegram worker started');

// Проверка событий за 1 час до начала каждый час
cron.schedule('0 * * * *', async () => {
  console.log('Checking for upcoming events...');
  
  const oneHourLater = new Date();
  oneHourLater.setHours(oneHourLater.getHours() + 1);
  
  const result = await pool.query(`
    SELECT e.id, e.title, e.address, e.organizer_id, ep.user_id
    FROM events e
    JOIN event_participants ep ON e.id = ep.event_id
    WHERE e.event_date <= $1 
      AND e.event_date > NOW()
      AND ep.status = 'accepted'
  `, [oneHourLater]);
  
  for (const participant of result.rows) {
    await notificationQueue.add({
      userId: participant.user_id,
      type: 'event_reminder',
      eventTitle: participant.title,
      address: participant.address
    });
  }
});

notificationQueue.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed: ${err.message}`);
});
