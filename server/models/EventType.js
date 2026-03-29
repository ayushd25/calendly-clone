const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventType = sequelize.define('EventType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
    },
    location: {
        type: DataTypes.STRING,
        defaultValue: 'Online Meeting'
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#0D9488'
    },
    availableDays: {
        type: DataTypes.JSON,
        defaultValue: [1, 2, 3, 4, 5]
    },
    startTime: {
        type: DataTypes.STRING,
        defaultValue: '09:00'
    },
    endTime: {
        type: DataTypes.STRING,
        defaultValue: '17:00'
    },
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'Asia/Kolkata'
    },
    bufferBefore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    bufferAfter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    customQuestions: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    dateOverrides: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'event_types'
});

module.exports = EventType;