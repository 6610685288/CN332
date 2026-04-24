const User = require('../models/user.model');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }, // ไม่ส่งรหัสผ่านออกไป
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('ADMIN FETCH ALL USERS ERROR:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.role = role;
        await user.save();

        res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
        console.error('UPDATE ROLE ERROR:', error);
        res.status(500).json({ message: 'Error updating role' });
    }
};

// Update own profile
exports.updateProfile = async (req, res) => {
    try {
        const { username, firstName, lastName, phone, birthDate } = req.body;
        const user = await User.findOne({ where: { elderlyId: req.user.elderlyId } });
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        // ตรวจสอบ username ซ้ำ (ถ้ามีการเปลี่ยน)
        if (username && username !== user.username) {
            const existing = await User.findOne({ where: { username } });
            if (existing) {
                return res.status(409).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' });
            }
            user.username = username;
        }

        // Optional fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (birthDate !== undefined) user.birthDate = birthDate || null;

        // อัปเดต name จาก firstName + lastName (ถ้ากรอก)
        if (firstName || lastName) {
            user.name = [firstName, lastName].filter(Boolean).join(' ');
        }

        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

