const socketHandler = (io) => {
    // This listens for any new device connecting to your app
    io.on('connection', (socket) => {
        console.log(`🔌 New device connected to live tracking: ${socket.id}`);

        // 1. Join a specific "room" for a single rescue operation
        // This ensures tracking data only goes to the people involved in this specific rescue
        socket.on('joinRescue', (rescueId) => {
            socket.join(rescueId);
            console.log(`User joined rescue tracking room: ${rescueId}`);
        });

        // 2. Listen for live GPS updates from the NGO's phone
        socket.on('sendLocationUpdate', (data) => {
            // data will look like: { rescueId: "123", coordinates: [lng, lat] }
            // Broadcast this location ONLY to the reporter waiting in that specific room
            socket.to(data.rescueId).emit('receiveLocationUpdate', data.coordinates);
        });

        // 3. Listen for status changes (e.g., "NGO Arrived", "Animal Secured")
        socket.on('sendStatusUpdate', (data) => {
            // Broadcast the new status to update the Reporter's timeline UI instantly
            socket.to(data.rescueId).emit('receiveStatusUpdate', data.status);
        });

        // Handle the user closing the app or losing connection
        socket.on('disconnect', () => {
            console.log(`🔴 Device disconnected: ${socket.id}`);
        });
    });
};

module.exports = socketHandler;