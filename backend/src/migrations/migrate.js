const pool = require('../config/database');

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT NOT NULL,
    karma INT DEFAULT 0,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    event_date TIMESTAMP NOT NULL,
    max_participants INT NOT NULL,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active'
  )`,
  
  `CREATE TABLE IF NOT EXISTS event_participants (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT NOW(),
    checked_in BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (event_id, user_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS event_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES event_chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS telegram_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    chat_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_events_city ON events(city)`,
  `CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)`,
  `CREATE INDEX IF NOT EXISTS idx_participants_status ON event_participants(status)`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
      console.log('✓ Migration executed');
    }
    console.log('✅ All migrations completed');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
