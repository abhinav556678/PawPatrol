const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware (Must be defined before routes)
app.use(cors());
app.use(express.json());

// Initialize Socket.io for live tracking
const io = new Server(server, {
    cors: {
        origin: "*", // 🚨 CHANGED TO ASTERISK: Allows your phone's IP to connect!
        methods: ["GET", "POST"]
    }
});

// 🚨 THE LIVE SOCKET RADIO TOWER 🚨
io.on('connection', (socket) => {
    console.log('📡 A user connected to the Live Network');

    // Handle new emergencies submitted by the Reporter app
    socket.on('newRescueReport', (data) => {
        io.emit('newRescueReport', data); // Broadcasts to NGO dashboard
    });

    // 1. Listen for the NGO assigning a rescue
    socket.on('assignRescue', (data) => {
        console.log(`Rescue assigned to Driver: ${data.driverId}`);
        // Broadcast it to the drivers. The correct driver will catch it!
        io.emit('rescueAssigned', data);
    });

    // 2. Listen for the Real GPS coming from the driver's phone
    socket.on('driverLocationUpdate', (data) => {
        // Broadcast the new coordinates back to the NGO map
        io.emit('updateMap', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// NOTE: Since we just put the Socket logic directly in this file, 
// we don't need the external socketHandler file anymore. I commented it out!
// const socketHandler = require('./sockets/socketHandler');
// socketHandler(io);


// 🚨 ROUTES
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));

// Basic test route
app.get('/api/status', (req, res) => {
    res.json({ message: 'Animal Rescue API is online and running.' });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});