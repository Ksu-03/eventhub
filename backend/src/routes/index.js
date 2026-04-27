const express = require('express');
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const userController = require('../controllers/userController');

const router = express.Router();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);

// Event routes
router.get('/events', eventController.listEvents);
router.get('/events/:id', eventController.getEvent);
router.post('/events', authMiddleware, eventController.createEvent);
router.put('/events/:id', authMiddleware, eventController.updateEvent);
router.delete('/events/:id', authMiddleware, eventController.deleteEvent);
router.post('/events/:id/join', authMiddleware, eventController.joinEvent);
router.post('/events/:id/participants/:userId/status', authMiddleware, eventController.updateParticipantStatus);
router.get('/events/:id/qr', authMiddleware, eventController.generateQR);
router.post('/events/:id/checkin', authMiddleware, eventController.checkIn);

// User routes
router.get('/users/me/events', authMiddleware, eventController.getUserEvents);
router.post('/users/me/telegram', authMiddleware, userController.addTelegramToken);

module.exports = router;
