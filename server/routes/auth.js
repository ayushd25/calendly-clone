const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, username } = req.body;
        if (!name || !email || !password || !username) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const existing = await User.findOne({
            where: { [Op.or]: [{ email }, { username }] }
        });
        if (existing) {
            return res.status(400).json({ message: 'Email or username already exists' });
        }
        const user = await User.create({ name, email, password, username });
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, username: user.username },
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            user: { id: user.id, name: user.name, email: user.email, username: user.username },
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/me', auth, async (req, res) => {
    res.json({
        user: { id: req.user.id, name: req.user.name, email: req.user.email, username: req.user.username }
    });
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, username } = req.body;
        if (email && email !== req.user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return res.status(400).json({ message: 'Email already in use' });
        }
        if (username && username !== req.user.username) {
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) return res.status(400).json({ message: 'Username already in use' });
        }
        if (name) req.user.name = name;
        if (email) req.user.email = email;
        if (username) req.user.username = username;
        await req.user.save();
        res.json({
            user: { id: req.user.id, name: req.user.name, email: req.user.email, username: req.user.username }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;