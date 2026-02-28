const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityJoin = sequelize.define('ActivityJoin', {
    elderlyId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    activityId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'joined'
    }
});

module.exports = ActivityJoin;