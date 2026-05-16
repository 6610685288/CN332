const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Note = sequelize.define('Note', {
    elderlyId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    detail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    scheduledTime: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

module.exports = Note;
