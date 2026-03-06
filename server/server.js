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

// Initialize Socket.io for live tracking later
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite's default React port
        methods: ["GET", "POST"]
    }
});

// Attach our custom socket logic to the server
const socketHandler = require('./sockets/socketHandler');
socketHandler(io);

// Middleware
app.use(cors());
app.use(express.json());

// 🚨 MAKE SURE THESE ARE NOT COMMENTED OUT:
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Basic test route
app.get('/api/status', (req, res) => {
    res.json({ message: 'Animal Rescue API is online and running.' });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});