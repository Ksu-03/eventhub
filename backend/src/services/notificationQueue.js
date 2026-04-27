const Queue = require('bull');
const axios = require('axios');
const pool = require('../config/database');

const notificationQueue = new Queue('telegram-notifications', process.env.REDIS_URL);

notificationQueue.process(async (job) => {
  const { userId, type, eventId, eventTitle, userName, address, status } = job.data;
  
  try {
    const tokenResult = await pool.query(
      'SELECT chat_id FROM telegram_tokens WHERE user_id = $1',
      [userId]
    );
    
    if (!tokenResult.rows[0]) return;
    
    const chatId = tokenResult.rows[0].chat_id;
    let text = '';
    let link = '';
    
    switch (type) {
      case 'join_request':
        text = `🔔 ${userName} хочет на "${eventTitle}"!`;
        break;
      case 'request_accepted':
        link = `${process.env.FRONTEND_URL}/events/${eventId}/chat`;
        text = `✅ Вас приняли на "${eventTitle}"! Чат: ${link}`;
        break;
      case 'request_rejected':
        text = `❌ К сожалению, отказано на "${eventTitle}"`;
        break;
      case 'event_reminder':
        text = `⏰ Скоро "${eventTitle}" в ${address}`;
        break;
      case 'checked_in':
        text = `✅ Вы отмечены на событии "${eventTitle}"!`;
        break;
    }
    
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    
    console.log(`Telegram notification sent to ${userId}: ${type}`);
  } catch (err) {
    if (err.response?.status === 403) {
      // Токен недействителен, удаляем его
      await pool.query('DELETE FROM telegram_tokens WHERE user_id = $1', [userId]);
      console.log(`Removed invalid telegram token for user ${userId}`);
    } else {
      console.error(`Failed to send Telegram notification: ${err.message}`);
      throw err;
    }
  }
});

module.exports = notificationQueue;
