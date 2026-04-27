const pool = require('../config/database');

class Event {
  static async create({ title, description, city, address, latitude, longitude, eventDate, maxParticipants, organizerId }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO events (title, description, city, address, latitude, longitude, event_date, max_participants, organizer_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [title, description, city, address, latitude, longitude, eventDate, maxParticipants, organizerId]
      );
      
      const event = result.rows[0];
      
      // Добавляем организатора как accepted участника
      await client.query(
        `INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, 'accepted')`,
        [event.id, organizerId]
      );
      
      // Создаем чат для события
      await client.query(`INSERT INTO event_chats (event_id) VALUES ($1)`, [event.id]);
      
      await client.query('COMMIT');
      return event;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT e.*, u.name as organizer_name, u.email as organizer_email,
             (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'accepted') as current_participants
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async getParticipants(eventId) {
    const result = await pool.query(`
      SELECT ep.*, u.name, u.email, u.avatar_url
      FROM event_participants ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = $1
    `, [eventId]);
    return result.rows;
  }

  static async list({ city, dateFrom, limit = 20, offset = 0 }) {
    let query = `
      SELECT e.*, u.name as organizer_name,
             (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'accepted') as current_participants
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (city) {
      query += ` AND e.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND e.event_date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    query += ` ORDER BY e.event_date ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, organizerId, data) {
    const sets = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['title', 'description', 'address', 'latitude', 'longitude', 'event_date', 'max_participants'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (sets.length === 0) return null;

    values.push(id, organizerId);
    const result = await pool.query(
      `UPDATE events SET ${sets.join(', ')} WHERE id = $${paramIndex} AND organizer_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id, organizerId) {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND organizer_id = $2 RETURNING id',
      [id, organizerId]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE events SET status = $1 WHERE id = $2', [status, id]);
  }
}

module.exports = Event;
