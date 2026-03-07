import React, { createContext } from 'react';
import { io } from 'socket.io-client';

// Connect to your backend port
const socket = io('http://10.124.59.40:5001');

// 🚨 This export right here fixes your error!
export const SocketContext = createContext();

// This wrapper is used in your main.jsx to provide the socket to the whole app
export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};