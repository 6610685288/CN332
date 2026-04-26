// init-admin.js
const User = require('./src/models/user.model');

async function makeAllAdmins() {
    try {
        console.log('--- Promote Users to Admin ---');
        const [updatedCount] = await User.update(
            { role: 'admin' },
            { where: {} } // อัปเดตทุกคนที่อยู่ในตารางตอนนี้
        );
        
        console.log(`✅ Success! Updated ${updatedCount} users to Admin.`);
        console.log('You can now log in via Google and you will see the Admin Dashboard.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

makeAllAdmins();
