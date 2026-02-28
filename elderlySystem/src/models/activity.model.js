const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = Activity;