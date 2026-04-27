const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const QRCode = require('qrcode');

async function listEvents(req, res) {
  try {
    const { city, date_from, limit = 20, offset = 0 } = req.query;
    const events = await Event.list({ city, dateFrom: date_from, limit, offset });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

async function getEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const participants = await Event.getParticipants(req.params.id);
    res.json({ event, participants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

async function createEvent(req, res) {
  try {
    const { title, description, city, address, latitude, longitude, event_date, max_participants } = req.body;
    
    const event = await Event.create({
      title,
      description,
      city,
      address,
      latitude,
      longitude,
      eventDate: event_date,
      maxParticipants: max_participants,
      organizerId: req.userId
    });
    
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await Event.update(req.params.id, req.userId, req.body);
    if (!event) {
      return res.status(404).json({ error: 'Event not found or not authorized' });
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

async function deleteEvent(req, res) {
  try {
    const event = await Event.delete(req.params.id, req.userId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found or not authorized' });
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

async function joinEvent(req, res) {
  try {
    const participant = await EventParticipant.addRequest(req.params.id, req.userId);
    res.json(participant);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

async function updateParticipantStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const participant = await EventParticipant.updateStatus(req.params.id, userId, status, req.userId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(participant);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: err.message });
  }
}

async function getUserEvents(req, res) {
  try {
    const events = await EventParticipant.getUserEvents(req.userId);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
}

async function generateQR(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.organizer_id !== req.userId) {
      return res.status(403).json({ error: 'Only organizer can generate QR code' });
    }
    
    const payload = JSON.stringify({
      eventId: event.id,
      organizerId: event.organizer_id
    });
    
    const qrCode = await QRCode.toDataURL(payload);
    res.json({ qrCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

async function checkIn(req, res) {
  try {
    const participant = await EventParticipant.checkIn(req.params.id, req.userId);
    if (!participant) {
      return res.status(400).json({ error: 'Cannot check in. User not accepted or already checked in' });
    }
    res.json({ checked_in: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  updateParticipantStatus,
  getUserEvents,
  generateQR,
  checkIn
};
