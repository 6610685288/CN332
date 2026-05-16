const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// POST /api/booking/create
exports.createBooking = async (req, res) => {
    try {
        const {
            destination,
            scheduledTime,
            vehicleType,
            passengers,
            wheelchair,
            helper
        } = req.body;

        // elderlyId always comes from verified JWT token
        const elderlyId = req.user.elderlyId;

        // Input validation
        if (!destination || !scheduledTime) {
            return res.status(400).json({ message: 'destination and scheduledTime are required' });
        }
        if (destination.trim().length === 0) {
            return res.status(400).json({ message: 'destination cannot be empty' });
        }
        if (passengers !== undefined && (isNaN(passengers) || passengers < 1)) {
            return res.status(400).json({ message: 'passengers must be a positive number' });
        }

        if (passengers !== undefined && (isNaN(passengers) || passengers < 1)) {
            return res.status(400).json({ message: 'passengers must be a positive number' });
        }

        // Conflict Detection: ตรวจสอบการจองในช่วง 1 ชั่วโมงที่ผ่านมาหรือข้างหน้า
        const { Op } = require('sequelize');
        
        let bookingTime;
        if (scheduledTime === 'now') {
            bookingTime = new Date();
        } else {
            bookingTime = new Date(scheduledTime);
            // ถ้าเป็นรูปแบบเวลา "10:30"
            if (isNaN(bookingTime.getTime())) {
                const parts = scheduledTime.split(':');
                bookingTime = new Date();
                bookingTime.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
            }
        }

        const buffer = 60 * 60 * 1000; // 1 ชั่วโมง

        // ดึงรายการจองที่ยังไม่เสร็จสิ้นของผู้ใช้นี้มาเช็ค
        const activeBookings = await Booking.findAll({
            where: {
                elderlyId,
                status: {
                    [Op.in]: ['pending', 'approved']
                }
            }
        });

        const isConflict = activeBookings.some(b => {
            let bTime = new Date();
            if (b.scheduledTime !== 'now') {
                const bDate = new Date(b.scheduledTime);
                if (!isNaN(bDate.getTime())) {
                    bTime = bDate;
                } else {
                    const parts = b.scheduledTime.split(':');
                    bTime.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
                }
            }
            return Math.abs(bTime.getTime() - bookingTime.getTime()) < buffer;
        });

        if (isConflict) {
            return res.status(409).json({ message: 'คุณมีการจองรถในเวลานี้อยู่แล้ว (ห่างกันไม่ถึง 1 ชั่วโมง)' });
        }

        const newBooking = await Booking.create({
            elderlyId,
            destination,
            scheduledTime,
            vehicleType: vehicleType || 'ไม่ระบุ',
            passengers: passengers || 1,
            wheelchair: !!wheelchair,
            helper: !!helper,
            status: 'pending'
        });
        
        // Notify Admins and Staff
        try {
            const adminUsers = await User.findAll({
                where: {
                    role: { [Op.in]: ['admin', 'staff'] }
                }
            });
            const notifications = adminUsers.map(admin => ({
                elderlyId: admin.elderlyId,
                title: '🛎️ มีคำขอเรียกรถใหม่',
                message: `ผู้ใช้ ${elderlyId} เรียกรถไปยัง ${destination} (เวลา: ${scheduledTime})`
            }));
            await Notification.bulkCreate(notifications);
        } catch (e) {
            console.error('Failed to notify admin:', e);
        }

        res.status(201).json({
            message: 'Booking created successfully',
            booking: newBooking
        });

    } catch (error) {
        console.error('CREATE BOOKING ERROR:', error);
        res.status(500).json({ message: 'Error creating booking' });
    }
};

// GET /api/booking/my-bookings
exports.getMyBookings = async (req, res) => {
    try {
        // elderlyId from JWT token (no longer a URL param - prevents access to others' bookings)
        const elderlyId = req.user.elderlyId;

        const bookings = await Booking.findAll({
            where: { elderlyId },
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);
    } catch (error) {
        console.error('GET BOOKINGS ERROR:', error);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
};

// Admin: Get all bookings from everyone (with user name)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            order: [['createdAt', 'DESC']]
        });

        // Enrich with user display name
        const enriched = await Promise.all(bookings.map(async (b) => {
            const user = await User.findOne({
                where: { elderlyId: b.elderlyId },
                attributes: ['name', 'firstName', 'lastName', 'username']
            });
            const displayName = user
                ? (user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : (user.name || user.username))
                : b.elderlyId;
            return { ...b.toJSON(), displayName };
        }));

        res.json(enriched);
    } catch (error) {
        console.error('ADMIN FETCH ALL BOOKINGS ERROR:', error);
        res.status(500).json({ message: 'Error fetching all bookings' });
    }
};

// Admin: Update booking status (approved / rejected)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowed = ['approved', 'rejected', 'completed'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
        }

        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = status;
        await booking.save();

        if (status === 'rejected') {
            await Notification.create({
                elderlyId: booking.elderlyId,
                title: 'การจองรถถูกปฏิเสธ',
                message: `การจองรถไปยัง ${booking.destination} วันที่ ${booking.scheduledTime === 'now' ? 'ด่วน (ตอนนี้)' : new Date(booking.scheduledTime).toLocaleString('th-TH')} ไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่`
            });
        } else if (status === 'approved') {
            await Notification.create({
                elderlyId: booking.elderlyId,
                title: 'การจองรถได้รับการอนุมัติ',
                message: `การจองรถไปยัง ${booking.destination} วันที่ ${booking.scheduledTime === 'now' ? 'ด่วน (ตอนนี้)' : new Date(booking.scheduledTime).toLocaleString('th-TH')} ได้รับการอนุมัติแล้ว`
            });
        }

        res.json({ message: `Booking ${status} successfully`, booking });
    } catch (error) {
        console.error('UPDATE BOOKING STATUS ERROR:', error);
        res.status(500).json({ message: 'Error updating booking status' });
    }
};

// User: Cancel own booking
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const elderlyId = req.user.elderlyId;

        const booking = await Booking.findByPk(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // ป้องกันยกเลิกของคนอื่น
        if (booking.elderlyId !== elderlyId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (booking.status === 'approved') {
            return res.status(400).json({ message: 'ไม่สามารถยกเลิกการจองที่อนุมัติแล้วได้ กรุณาติดต่อเจ้าหน้าที่' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({ message: 'ยกเลิกการจองเรียบร้อยแล้ว', booking });
    } catch (error) {
        console.error('CANCEL BOOKING ERROR:', error);
        res.status(500).json({ message: 'Error cancelling booking' });
    }
};