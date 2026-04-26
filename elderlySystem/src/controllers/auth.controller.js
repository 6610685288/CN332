const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { elderlyId, username, password, name } = req.body;

        if (!elderlyId || !username || !password || !name) {
            return res.status(400).json({ message: 'elderlyId, username, password and name are required' });
        }

        // Check if username or elderlyId already exists
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        const existingId = await User.findOne({ where: { elderlyId } });
        if (existingId) {
            return res.status(409).json({ message: 'ElderlyId already registered' });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({
            elderlyId,
            username,
            password: hashed,
            name
        });

        res.status(201).json({
            message: 'Registration successful',
            user: { elderlyId: user.elderlyId, username: user.username, name: user.name }
        });

    } catch (error) {
        console.error('REGISTER ERROR:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                elderlyId: user.elderlyId,
                username: user.username,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                elderlyId: user.elderlyId,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
};

// POST /api/auth/social-login
exports.socialLogin = async (req, res) => {
    try {
        const { id, name, provider } = req.body;

        if (!id || !name) {
            return res.status(400).json({ message: 'ID and Name are required' });
        }

        // Check if user exists (use social ID as elderlyId)
        let user = await User.findOne({ where: { elderlyId: id } });

        // ดึงรายการ Admin จาก .env
        const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
        const shouldBeAdmin = adminIds.includes(id.toString());

        if (!user) {
            // Create a new user for this social account
            user = await User.create({
                elderlyId: id,
                username: `social_${id.substring(0, 8)}`,
                password: 'social_login_no_password', // Not used for social login
                name: name,
                role: shouldBeAdmin ? 'admin' : 'elderly'
            });
        } else if (shouldBeAdmin && user.role !== 'admin') {
            // ถ้ามี User อยู่แล้วแต่ใน .env บอกว่าเป็น Admin ก็อัปเดตให้เลย
            user.role = 'admin';
            await user.save();
        }

        const token = jwt.sign(
            {
                elderlyId: user.elderlyId,
                username: user.username,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token, user });

    } catch (error) {
        console.error('SOCIAL LOGIN ERROR:', error);
        res.status(500).json({ message: 'Error in social login' });
    }
};

// GET /api/auth/me  (protected)
exports.getMe = async (req, res) => {
    res.json({
        elderlyId: req.user.elderlyId,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role
    });
};
