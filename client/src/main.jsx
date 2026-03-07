import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 🚨 IMPORT THE PROVIDER HERE:
import { SocketProvider } from './context/SocketContext.jsx' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🚨 WRAP THE APP IN THE PROVIDER: */}
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>,
)