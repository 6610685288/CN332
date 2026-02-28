const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    elderlyId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: false
    },
    scheduledTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    passengers: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    wheelchair: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    helper: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
});

module.exports = Booking;