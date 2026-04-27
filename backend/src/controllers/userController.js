const User = require('../models/User');

async function addTelegramToken(req, res) {
  try {
    const { telegram_chat_id } = req.body;
    if (!telegram_chat_id) {
      return res.status(400).json({ error: 'telegram_chat_id required' });
    }
    
    await User.addTelegramToken(req.userId, telegram_chat_id);
    res.json({ message: 'Telegram connected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to connect Telegram' });
  }
}

module.exports = { addTelegramToken };
