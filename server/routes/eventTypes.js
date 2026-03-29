const express = require('express');
const { Op, fn } = require('sequelize');
const EventType = require('../models/EventType');
const Booking = require('../models/Booking');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}

async function makeUniqueSlug(slug, userId, excludeId) {
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
        const where = { slug: uniqueSlug };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        const existing = await EventType.findOne({ where });
        if (!existing) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }
    return uniqueSlug;
}

// Get current user's event types
router.get('/', auth, async (req, res) => {
    try {
        const eventTypes = await EventType.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        const eventTypeIds = eventTypes.map(et => et.id);
        let bookingCounts = [];
        if (eventTypeIds.length > 0) {
            bookingCounts = await Booking.findAll({
                where: { eventTypeId: { [Op.in]: eventTypeIds }, status: { [Op.ne]: 'cancelled' } },
                attributes: ['eventTypeId', [fn('COUNT', '*'), 'count']],
                group: ['eventTypeId'], raw: true
            });
        }
        const countMap = {};
        bookingCounts.forEach(bc => { countMap[bc.eventTypeId] = parseInt(bc.count); });
        const result = eventTypes.map(et => ({ ...et.toJSON(), bookingCount: countMap[et.id] || 0 }));
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get single event type by ID
router.get('/:id', async (req, res) => {
    try {
        const eventType = await EventType.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{ model: User, attributes: ['id', 'name', 'username'] }]
        });
        if (!eventType) return res.status(404).json({ message: 'Event type not found' });
        res.json(eventType);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get event type by username + slug
router.get('/by-slug/:username/:slug', async (req, res) => {
    try {
        const user = await User.findOne({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const eventType = await EventType.findOne({
            where: { userId: user.id, slug: req.params.slug, isActive: true },
            include: [{ model: User, attributes: ['id', 'name', 'username'] }]
        });
        if (!eventType) return res.status(404).json({ message: 'Event type not found' });
        res.json(eventType);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Get event types by username (public list)
router.get('/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const eventTypes = await EventType.findAll({
            where: { userId: user.id, isActive: true },
            order: [['createdAt', 'DESC']]
        });
        res.json({ user: { name: user.name, username: user.username }, eventTypes });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Create event type
router.post('/', auth, async (req, res) => {
    try {
        const { title, slug, description, duration, location, color, availableDays, startTime, endTime, timezone, bufferBefore, bufferAfter, customQuestions, dateOverrides } = req.body;
        if (!title) return res.status(400).json({ message: 'Title is required' });
        const finalSlug = slug || generateSlug(title);
        const uniqueSlug = await makeUniqueSlug(finalSlug, req.user.id);
        const eventType = await EventType.create({
            userId: req.user.id, title, slug: uniqueSlug,
            description: description || '', duration: duration || 30,
            location: location || 'Online Meeting', color: color || '#0D9488',
            availableDays: availableDays || [1, 2, 3, 4, 5],
            startTime: startTime || '09:00', endTime: endTime || '17:00',
            timezone: timezone || 'Asia/Kolkata',
            bufferBefore: bufferBefore || 0, bufferAfter: bufferAfter || 0,
            customQuestions: customQuestions || [], dateOverrides: dateOverrides || {}
        });
        res.status(201).json(eventType);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Update event type
router.put('/:id', auth, async (req, res) => {
    try {
        const eventType = await EventType.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!eventType) return res.status(404).json({ message: 'Event type not found' });
        const fields = ['title', 'description', 'duration', 'location', 'color', 'availableDays', 'startTime', 'endTime', 'timezone', 'bufferBefore', 'bufferAfter', 'customQuestions', 'dateOverrides', 'isActive'];
        fields.forEach(f => { if (req.body[f] !== undefined) eventType[f] = req.body[f]; });
        // Handle slug update
        if (req.body.slug !== undefined && req.body.slug !== eventType.slug) {
            const uniqueSlug = await makeUniqueSlug(req.body.slug, req.user.id, eventType.id);
            eventType.slug = uniqueSlug;
        }
        await eventType.save();
        res.json(eventType);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Delete event type
router.delete('/:id', auth, async (req, res) => {
    try {
        const eventType = await EventType.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!eventType) return res.status(404).json({ message: 'Event type not found' });
        await Booking.destroy({ where: { eventTypeId: eventType.id } });
        await eventType.destroy();
        res.json({ message: 'Event type deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;