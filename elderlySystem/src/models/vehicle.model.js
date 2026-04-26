const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,  // 'Golf Cart', 'Van', 'Sedan'
        defaultValue: 'Golf Cart'
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: '🛺'
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 4
    },
    status: {
        type: DataTypes.ENUM('available', 'busy', 'maintenance'),
        defaultValue: 'available'
    },
    plateNumber: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Vehicle;
