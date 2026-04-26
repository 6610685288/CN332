const jwt = require('jsonwebtoken');

/**
 * 1. Decorator Pattern (Higher-Order Function)
 * หุ้ม (Wrap) Controller function ด้วย Logic การตรวจสอบ Token
 */
const withAuth = (controllerFunction) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { elderlyId, username, role, name }
            
            // ส่งต่อการทำงานไปยัง Controller ตัวจริงที่ถูก Decorate ไว้
            return await controllerFunction(req, res, next);
        } catch (error) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
    };
};

/**
 * 2. Adapter Pattern สำหรับ Middleware (ไม่ให้กระทบโค้ดเก่า)
 * นำ Decorator ด้านบนมาปรับให้ทำงานแบบ Express Middleware เดิม
 */
const authMiddleware = (req, res, next) => {
    // สร้าง Dummy Controller ที่ทำหน้าที่แค่สั่ง next() ให้ Express ทำงานต่อไปยัง Controller จริง
    const proceedToNext = (req, res, next) => next();
    
    // เรียกใช้ Decorator เพื่อหุ้ม Dummy
    const decoratedMiddleware = withAuth(proceedToNext);
    
    // รันผลลัพธ์
    return decoratedMiddleware(req, res, next);
};

// Export Middleware รูปแบบเดิมเพื่อให้โค้ดที่อิมพอร์ตไปก่อนหน้านี้ไม่พัง
authMiddleware.withAuth = withAuth; // แถม Decorator ให้เรียกใช้งานด้วยเผื่อต้องการ

module.exports = authMiddleware;
