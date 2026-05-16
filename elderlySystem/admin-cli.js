require('dotenv').config();
const inquirer = require('inquirer');
const chalk = require('chalk');
const Table = require('cli-table3');

const sequelize = require('./src/config/database');
const User = require('./src/models/user.model');
const Booking = require('./src/models/booking.model');

// โหลดโมเดลอื่นๆ เพื่อไม่ให้ associations ขาดหายไป
require('./src/models/incident.model');
require('./src/models/vehicle.model');
const Activity = require('./src/models/activity.model');
const ActivityJoin = require('./src/models/activityJoin.model');
const Notification = require('./src/models/notification.model');
ActivityJoin.belongsTo(Activity, { foreignKey: 'activityId' });
Activity.hasMany(ActivityJoin, { foreignKey: 'activityId' });

const clearScreen = () => {
    process.stdout.write('\x1Bc');
};

const showHeader = () => {
    clearScreen();
    console.log(chalk.blue.bold('===================================================='));
    console.log(chalk.cyan.bold('         🌟 ELDERLY SYSTEM - ADMIN CLI 🌟         '));
    console.log(chalk.blue.bold('====================================================\n'));
};

const viewUsers = async () => {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    
    const table = new Table({
        head: [chalk.yellow('ID'), chalk.yellow('Elderly ID'), chalk.yellow('Username'), chalk.yellow('Name'), chalk.yellow('Role')],
        colWidths: [5, 15, 20, 20, 15]
    });

    users.forEach(user => {
        let roleColor = chalk.white;
        if (user.role === 'admin') roleColor = chalk.red.bold;
        if (user.role === 'staff') roleColor = chalk.green.bold;
        
        table.push([
            user.id,
            user.elderlyId,
            user.username,
            user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-',
            roleColor(user.role)
        ]);
    });

    console.log(chalk.cyan.bold('\n--- 👥 User Management ---'));
    console.log(table.toString());
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const changeUserRole = async () => {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    if (users.length === 0) {
        console.log(chalk.red('No users found!'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        return;
    }

    const { targetUserId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'targetUserId',
            message: 'Select user to change role:',
            choices: users.map(u => ({
                name: `[${u.id}] ${u.username} (Current: ${u.role})`,
                value: u.id
            }))
        }
    ]);

    const { newRole } = await inquirer.prompt([
        {
            type: 'list',
            name: 'newRole',
            message: 'Select new role:',
            choices: ['elderly', 'staff', 'admin']
        }
    ]);

    await User.update({ role: newRole }, { where: { id: targetUserId } });
    console.log(chalk.green.bold(`\n✅ User role updated to '${newRole}' successfully!\n`));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const viewBookings = async () => {
    const bookings = await Booking.findAll({ order: [['id', 'DESC']] });
    
    const table = new Table({
        head: [chalk.yellow('ID'), chalk.yellow('Elderly ID'), chalk.yellow('Destination'), chalk.yellow('Time'), chalk.yellow('Status')],
        colWidths: [5, 15, 20, 20, 15]
    });

    bookings.forEach(b => {
        let statusColor = chalk.white;
        if (b.status === 'pending') statusColor = chalk.yellow;
        if (b.status === 'approved') statusColor = chalk.green;
        if (b.status === 'cancelled') statusColor = chalk.red;
        if (b.status === 'completed') statusColor = chalk.blue;

        table.push([
            b.id,
            b.elderlyId,
            b.destination,
            b.scheduledTime,
            statusColor(b.status)
        ]);
    });

    console.log(chalk.cyan.bold('\n--- 📅 Booking Management ---'));
    console.log(table.toString());
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const changeBookingStatus = async () => {
    const bookings = await Booking.findAll({ order: [['id', 'DESC']] });
    if (bookings.length === 0) {
        console.log(chalk.red('No bookings found!'));
        await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
        return;
    }

    const { targetBookingId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'targetBookingId',
            message: 'Select booking to change status:',
            choices: bookings.map(b => ({
                name: `[ID: ${b.id}] Dest: ${b.destination} (Current: ${b.status})`,
                value: b.id
            }))
        }
    ]);

    const { newStatus } = await inquirer.prompt([
        {
            type: 'list',
            name: 'newStatus',
            message: 'Select new status:',
            choices: ['pending', 'approved', 'cancelled', 'completed']
        }
    ]);

    await Booking.update({ status: newStatus }, { where: { id: targetBookingId } });
    console.log(chalk.green.bold(`\n✅ Booking status updated to '${newStatus}' successfully!\n`));
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const sendNotificationMenu = async () => {
    const { target } = await inquirer.prompt([
        {
            type: 'list',
            name: 'target',
            message: 'Who do you want to send a notification to?',
            choices: [
                { name: 'All Users in System (Every Role)', value: 'all' },
                { name: 'All Elderly Users', value: 'role:elderly' },
                { name: 'All Staff Users', value: 'role:staff' },
                { name: 'All Admin Users', value: 'role:admin' },
                { name: 'Specific User', value: 'specific' }
            ]
        }
    ]);

    let elderlyId = 'all';
    if (target === 'specific') {
        const users = await User.findAll({ where: { role: 'elderly' }, order: [['id', 'ASC']] });
        if (users.length === 0) {
            console.log(chalk.red('No elderly users found!'));
            await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
            return;
        }

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedUser',
                message: 'Select user:',
                choices: users.map(u => ({
                    name: `[${u.elderlyId}] ${u.name || u.username}`,
                    value: u.elderlyId
                }))
            }
        ]);
        elderlyId = answer.selectedUser;
    }

    const { title, message } = await inquirer.prompt([
        { type: 'input', name: 'title', message: 'Notification Title:', validate: input => input ? true : 'Required' },
        { type: 'input', name: 'message', message: 'Notification Message:', validate: input => input ? true : 'Required' }
    ]);

    if (elderlyId === 'all') {
        const users = await User.findAll();
        const notifications = users.map(u => ({
            elderlyId: u.elderlyId,
            title,
            message
        }));
        await Notification.bulkCreate(notifications);
        console.log(chalk.green.bold(`\n✅ Notification sent to all ${users.length} users successfully!\n`));
    } else if (elderlyId.startsWith('role:')) {
        const role = elderlyId.split(':')[1];
        const users = await User.findAll({ where: { role } });
        const notifications = users.map(u => ({
            elderlyId: u.elderlyId,
            title,
            message
        }));
        await Notification.bulkCreate(notifications);
        console.log(chalk.green.bold(`\n✅ Notification sent to ${users.length} ${role}s successfully!\n`));
    } else {
        await Notification.create({ elderlyId, title, message });
        console.log(chalk.green.bold(`\n✅ Notification sent successfully to ${elderlyId}!\n`));
    }

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
};

const mainMenu = async () => {
    let exit = false;
    while (!exit) {
        showHeader();
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    '👥 View All Users',
                    '🔑 Change User Role',
                    '📅 View All Bookings',
                    '✏️  Change Booking Status',
                    '📨 Send Notification',
                    new inquirer.Separator(),
                    '🚪 Exit'
                ]
            }
        ]);

        switch (action) {
            case '👥 View All Users':
                await viewUsers();
                break;
            case '🔑 Change User Role':
                await changeUserRole();
                break;
            case '📅 View All Bookings':
                await viewBookings();
                break;
            case '✏️  Change Booking Status':
                await changeBookingStatus();
                break;
            case '📨 Send Notification':
                await sendNotificationMenu();
                break;
            case '🚪 Exit':
                exit = true;
                break;
        }
    }
};

const runCLI = async () => {
    try {
        await sequelize.authenticate();
        await mainMenu();
    } catch (error) {
        console.error(chalk.red('❌ Failed to connect to database:'), error);
    } finally {
        await sequelize.close();
        console.log(chalk.gray('\nDatabase connection closed. Goodbye! 👋\n'));
        process.exit(0);
    }
};

runCLI();
