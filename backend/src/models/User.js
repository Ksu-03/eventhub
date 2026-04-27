const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create({ email, name, city, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, name, city, password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, name, city, karma, created_at`,
      [email, name, city, passwordHash]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, city, karma, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateKarma(userId, delta) {
    await pool.query('UPDATE users SET karma = karma + $1 WHERE id = $2', [delta, userId]);
  }

  static async addTelegramToken(userId, chatId) {
    await pool.query(
      `INSERT INTO telegram_tokens (user_id, chat_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) DO UPDATE SET chat_id = $2`,
      [userId, chatId]
    );
  }

  static async getTelegramToken(userId) {
    const result = await pool.query('SELECT chat_id FROM telegram_tokens WHERE user_id = $1', [userId]);
    return result.rows[0]?.chat_id;
  }
}

module.exports = User;
