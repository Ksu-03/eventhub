const pool = require('../config/database');

class Chat {
  static async getChatId(eventId) {
    const result = await pool.query('SELECT id FROM event_chats WHERE event_id = $1', [eventId]);
    return result.rows[0]?.id;
  }

  static async saveMessage(chatId, userId, message) {
    const result = await pool.query(
      `INSERT INTO chat_messages (chat_id, user_id, message) 
       VALUES ($1, $2, $3) RETURNING id, chat_id, user_id, message, sent_at`,
      [chatId, userId, message]
    );
    return result.rows[0];
  }

  static async getMessages(chatId, limit = 50) {
    const result = await pool.query(`
      SELECT cm.*, u.name, u.avatar_url
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.chat_id = $1
      ORDER BY cm.sent_at DESC
      LIMIT $2
    `, [chatId, limit]);
    return result.rows.reverse();
  }
}

module.exports = Chat;
