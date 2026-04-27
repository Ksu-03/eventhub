const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const Chat = require('../models/Chat');
const EventParticipant = require('../models/EventParticipant');
const notificationQueue = require('../services/notificationQueue');

function socketHandler(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query('SELECT id, name FROM users WHERE id = $1', [decoded.userId]);
      
      if (!result.rows[0]) {
        return next(new Error('User not found'));
      }
      
      socket.userId = result.rows[0].id;
      socket.userName = result.rows[0].name;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userName} connected`);

    socket.on('join:chat', async ({ chatId }) => {
      try {
        // Проверяем, имеет ли пользователь доступ к чату
        const eventResult = await pool.query(
          'SELECT event_id FROM event_chats WHERE id = $1',
          [chatId]
        );
        
        if (!eventResult.rows[0]) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        const status = await EventParticipant.getStatus(eventResult.rows[0].event_id, socket.userId);
        
        if (status !== 'accepted') {
          socket.emit('error', { message: 'You are not accepted to this event' });
          return;
        }
        
        socket.join(chatId);
        socket.currentChatId = chatId;
        
        // Отправляем историю сообщений
        const messages = await Chat.getMessages(chatId);
        socket.emit('chat:history', messages);
        
        console.log(`${socket.userName} joined chat ${chatId}`);
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('send:message', async ({ chatId, message }) => {
      try {
        if (!message || message.trim().length === 0) return;
        
        // Проверяем доступ к чату
        const eventResult = await pool.query(
          'SELECT event_id FROM event_chats WHERE id = $1',
          [chatId]
        );
        
        if (!eventResult.rows[0]) return;
        
        const status = await EventParticipant.getStatus(eventResult.rows[0].event_id, socket.userId);
        
        if (status !== 'accepted') {
          socket.emit('error', { message: 'You are not accepted to this event' });
          return;
        }
        
        // Сохраняем сообщение
        const savedMessage = await Chat.saveMessage(chatId, socket.userId, message);
        
        const messageData = {
          id: savedMessage.id,
          userId: socket.userId,
          name: socket.userName,
          message: savedMessage.message,
          sentAt: savedMessage.sent_at
        };
        
        // Отправляем всем в комнате
        io.to(chatId).emit('new:message', messageData);
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userName} disconnected`);
    });
  });
}

module.exports = socketHandler;
