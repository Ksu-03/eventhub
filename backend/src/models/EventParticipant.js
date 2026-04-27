const pool = require('../config/database');

class EventParticipant {
  static async addRequest(eventId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Проверяем количество участников с блокировкой строки
      const eventResult = await client.query(
        'SELECT max_participants FROM events WHERE id = $1 FOR UPDATE',
        [eventId]
      );
      
      if (!eventResult.rows[0]) throw new Error('Event not found');
      
      const countResult = await client.query(
        'SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND status = $2',
        [eventId, 'accepted']
      );
      
      const currentCount = parseInt(countResult.rows[0].count);
      if (currentCount >= eventResult.rows[0].max_participants) {
        throw new Error('Event is full');
      }
      
      const result = await client.query(
        `INSERT INTO event_participants (event_id, user_id, status) 
         VALUES ($1, $2, 'pending') 
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'pending'
         RETURNING *`,
        [eventId, userId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateStatus(eventId, userId, status, organizerId) {
    // Проверяем, что пользователь - организатор
    const eventCheck = await pool.query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (!eventCheck.rows[0] || eventCheck.rows[0].organizer_id !== organizerId) {
      throw new Error('Only organizer can change participant status');
    }
    
    const result = await pool.query(
      `UPDATE event_participants 
       SET status = $1 
       WHERE event_id = $2 AND user_id = $3 
       RETURNING *`,
      [status, eventId, userId]
    );
    return result.rows[0];
  }

  static async getStatus(eventId, userId) {
    const result = await pool.query(
      'SELECT status FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    return result.rows[0]?.status;
  }

  static async getUserEvents(userId) {
    const result = await pool.query(`
      SELECT e.*, ep.status as participant_status,
             (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'accepted') as current_participants,
             CASE WHEN e.organizer_id = $1 THEN true ELSE false END as is_organizer
      FROM events e
      JOIN event_participants ep ON e.id = ep.event_id
      WHERE ep.user_id = $1
      ORDER BY e.event_date ASC
    `, [userId]);
    return result.rows;
  }

  static async checkIn(eventId, userId) {
    const result = await pool.query(
      `UPDATE event_participants 
       SET checked_in = TRUE 
       WHERE event_id = $1 AND user_id = $2 AND status = 'accepted'
       RETURNING *`,
      [eventId, userId]
    );
    return result.rows[0];
  }
}

module.exports = EventParticipant;
