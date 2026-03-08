import React, { createContext } from 'react';
import { io } from 'socket.io-client';

// Connect to your backend port
const socket = io('http://localhost:5001');

// 🚨 This export right here fixes your error!
export const SocketContext = createContext();
socket.on('assignRescue', (data) => {
    const { driverId, report } = data;
    // 🚨 This sends the alert ONLY to the specific driver's phone
    io.emit(`newRescue-${driverId}`, report); 
});
// This wrapper is used in your main.jsx to provide the socket to the whole app
export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};