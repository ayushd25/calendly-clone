const express = require('express');
const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const EventType = require('../models/EventType');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const total = await Booking.count({ where: { hostId: req.user.id } });
        const upcoming = await Booking.count({ where: { hostId: req.user.id, date: { [Op.gte]: today }, status: { [Op.ne]: 'cancelled' } } });
        const past = await Booking.count({ where: { hostId: req.user.id, date: { [Op.lt]: today } } });
        const cancelled = await Booking.count({ where: { hostId: req.user.id, status: 'cancelled' } });
        res.json({ total, upcoming, past, cancelled });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get booked slots by event type ID
router.get('/slots/:eventTypeId', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date required' });
        const bookings = await Booking.findAll({
            where: { eventTypeId: req.params.eventTypeId, date, status: { [Op.ne]: 'cancelled' } },
            attributes: ['time', 'duration'], raw: true
        });
        res.json(bookings);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get booked slots by username + slug
router.get('/slots/slug/:username/:slug', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date required' });
        const user = await User.findOne({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const et = await EventType.findOne({ where: { userId: user.id, slug: req.params.slug } });
        if (!et) return res.status(404).json({ message: 'Event type not found' });
        const bookings = await Booking.findAll({
            where: { eventTypeId: et.id, date, status: { [Op.ne]: 'cancelled' } },
            attributes: ['time', 'duration'], raw: true
        });
        res.json(bookings);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get current user's bookings
router.get('/', auth, async (req, res) => {
    try {
        const { status, type } = req.query;
        let where = { hostId: req.user.id };
        if (status && status !== 'all') where.status = status;
        if (type === 'upcoming') {
            where.date = { [Op.gte]: new Date().toISOString().split('T')[0] };
            where.status = { [Op.ne]: 'cancelled' };
        } else if (type === 'past') {
            where.date = { [Op.lt]: new Date().toISOString().split('T')[0] };
        }
        const bookings = await Booking.findAll({
            where,
            include: [{ model: EventType, attributes: ['id', 'title', 'duration', 'color', 'location', 'slug'] }],
            order: [['date', 'ASC'], ['time', 'ASC']]
        });
        res.json(bookings);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Create booking
router.post('/', async (req, res) => {
    try {
        const { eventTypeId, guestName, guestEmail, date, time, notes, customAnswers } = req.body;
        if (!eventTypeId || !guestName || !guestEmail || !date || !time) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }
        const eventType = await EventType.findOne({ where: { id: eventTypeId, isActive: true } });
        if (!eventType) return res.status(404).json({ message: 'Event type not found' });
        const existing = await Booking.findOne({ where: { eventTypeId, date, time, status: { [Op.ne]: 'cancelled' } } });
        if (existing) return res.status(400).json({ message: 'This time slot is already booked' });
        const booking = await Booking.create({
            eventTypeId, hostId: eventType.userId, guestName, guestEmail, date, time,
            duration: eventType.duration, notes: notes || '', customAnswers: customAnswers || {}
        });
        res.status(201).json(booking);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Reschedule booking
router.put('/:id/reschedule', async (req, res) => {
    try {
        const { date, time, guestName, guestEmail } = req.body;
        if (!date || !time) return res.status(400).json({ message: 'Date and time required' });
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        // Check new slot is free
        const existing = await Booking.findOne({
            where: { eventTypeId: booking.eventTypeId, date, time, status: { [Op.ne]: 'cancelled' }, id: { [Op.ne]: booking.id } }
        });
        if (existing) return res.status(400).json({ message: 'This time slot is already booked' });
        booking.date = date;
        booking.time = time;
        if (guestName) booking.guestName = guestName;
        if (guestEmail) booking.guestEmail = guestEmail;
        await booking.save();
        res.json(booking);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Cancel booking
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['confirmed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const booking = await Booking.findOne({ where: { id: req.params.id, hostId: req.user.id } });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;