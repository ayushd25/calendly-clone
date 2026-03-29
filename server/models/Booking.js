const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    eventTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'event_types', key: 'id' }
    },
    hostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    guestName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    guestEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
        defaultValue: 'confirmed'
    },
    notes: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    customAnswers: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    tableName: 'bookings'
});

module.exports = Booking;