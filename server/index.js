require('dotenv').config();
const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
const User = require('./models/User');
const EventType = require('./models/EventType');
const Booking = require('./models/Booking');

const authRoutes = require('./routes/auth');
const eventTypeRoutes = require('./routes/eventTypes');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Connected to SQLite database');

        EventType.belongsTo(User, { foreignKey: 'userId' });
        User.hasMany(EventType, { foreignKey: 'userId' });
        Booking.belongsTo(EventType, { foreignKey: 'eventTypeId' });
        EventType.hasMany(Booking, { foreignKey: 'eventTypeId' });

        await sequelize.sync({ force: true });
        console.log('Tables created successfully');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database error:', error.message);
        process.exit(1);
    }
}

start();