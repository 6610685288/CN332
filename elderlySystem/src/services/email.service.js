const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an email.
 * @returns {Promise<boolean>} true if sent, false if failed
 */
const sendEmail = async (to, subject, text) => {
    // Guard: skip silently if email credentials are not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
        console.warn(`[EMAIL] Skipped sending to ${to}: EMAIL credentials not configured`);
        return false;
    }

    try {
        const mailOptions = {
            from: `"Elderly System Alert" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sent to ${to}:`, info.response);
        return true;

    } catch (error) {
        console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };