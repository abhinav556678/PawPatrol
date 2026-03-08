import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, CheckCircle, MapPin, Phone, AlertCircle, Navigation } from 'lucide-react';

const DriverDash = () => {
  const socket = useContext(SocketContext);
  const [activeRescue, setActiveRescue] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewAlert, setShowNewAlert] = useState(false); // 🚨 NEW: Modal state

  // 🔌 REPLACE with your laptop's IP (e.g., "http://192.168.1.45:5001")
  const SERVER_URL = "http://localhost:5001"; 
  const myDriverId = 'ambulance-1'; 

  // 1. Listen for connection status AND assigned rescues
  useEffect(() => {
    if (!socket) return;

    if (socket.connected) setIsConnected(true);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('rescueAssigned', (data) => {
      if (data.driverId === myDriverId) {
        // 📳 1. VIBRATE THE PHONE
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }

        // 🔊 2. PLAY EMERGENCY AUDIO
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio block:", e));
        
        // 🚨 3. TRIGGER FLASHING MODAL
        setShowNewAlert(true);
        setActiveRescue({ ...data.report, status: 'Dispatched' });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('rescueAssigned');
    };
  }, [socket]);

  // 2. THE REAL GPS TRACKER
  useEffect(() => {
    if (!socket || !activeRescue) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('driverLocationUpdate', {
          driverId: myDriverId,
          lat: latitude,
          lng: longitude
        });
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 } 
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, activeRescue]);

  const updateStatus = async (newStatus) => {
    if (activeRescue) setActiveRescue({ ...activeRescue, status: newStatus });
    
    try {
      await fetch(`${SERVER_URL}/api/reports/${activeRescue._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }

    if (newStatus === 'Resolved') setActiveRescue(null); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-md mx-auto border-x-4 border-gray-200 shadow-2xl relative">
      
      {/* 🚨 EMERGENCY OVERLAY MODAL */}
      {showNewAlert && activeRescue && (
        <div className="fixed inset-0 z-[5000] bg-red-600 flex flex-col items-center justify-center p-8 animate-pulse text-white">
          <AlertCircle size={100} className="mb-6 animate-bounce" />
          <h1 className="text-4xl font-black text-center leading-tight mb-4">
            EMERGENCY ASSIGNED
          </h1>
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30 text-center mb-10">
            <p className="text-2xl font-black uppercase">{activeRescue.animalType}</p>
            <p className="text-lg opacity-90 mt-2 italic">"{activeRescue.description}"</p>
          </div>
          <button 
            onClick={() => {
              setShowNewAlert(false);
              // Stop vibration if it's still pulsing
              if ("vibrate" in navigator) navigator.vibrate(0);
            }}
            className="w-full bg-white text-red-600 font-black py-6 rounded-2xl text-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <Navigation fill="currentColor" /> ACCEPT MISSION
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4 flex items-center gap-3 italic text-gray-800 uppercase tracking-tighter">
        <Truck className="text-orange-500" /> Driver Terminal
      </h1>

      <div className={`mb-6 font-bold text-xs p-3 rounded-xl border text-center shadow-sm ${isConnected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300 animate-pulse'}`}>
        {isConnected ? '🟢 RADIO LINK ACTIVE' : '🔴 RADIO DISCONNECTED'}
      </div>

      {activeRescue ? (
        <div className="space-y-6">
          <div className="h-[250px] w-full rounded-3xl overflow-hidden border-4 border-orange-500 shadow-xl relative z-0">
            <MapContainer center={[activeRescue.location.lat, activeRescue.location.lng]} zoom={16} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[activeRescue.location.lat, activeRescue.location.lng]} />
            </MapContainer>
          </div>

          <div className="border-2 border-orange-500 p-6 rounded-[2.5rem] bg-white shadow-lg">
            <div className="flex justify-between items-start mb-2">
               <h2 className="text-2xl font-black text-gray-900 leading-none">{activeRescue.animalType}</h2>
               <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded">PRIORITY 10</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">{activeRescue.description}</p>
            
            <div className="mt-6 p-4 bg-orange-50 rounded-2xl flex items-center gap-4 border border-orange-200">
              <div className="bg-orange-500 p-3 rounded-full text-white shadow-md"><Phone size={20}/></div>
              <div>
                <p className="text-[10px] text-orange-600 font-black uppercase">Contact Reporter</p>
                <p className="text-lg font-black text-gray-800">{activeRescue.reporterPhone || "98765 43210"}</p>
              </div>
            </div>

            <div className="grid gap-3 mt-8">
              <button 
                onClick={() => updateStatus('Arrived')} 
                className={`p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${activeRescue.status === 'Arrived' ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
              >
                <MapPin size={24} /> I AM ON SITE
              </button>
              <button 
                onClick={() => updateStatus('Resolved')} 
                className="p-5 rounded-2xl font-black text-lg bg-green-500 text-white shadow-lg shadow-green-100 active:scale-95 transition-transform flex items-center justify-center gap-3"
              >
                <CheckCircle size={24} /> MISSION COMPLETE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 border-4 border-dashed border-gray-200 rounded-[3rem] text-gray-300">
          <Activity size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-black text-xl uppercase tracking-widest">Scanning for<br/>Assignments...</p>
        </div>
      )}
    </div>
  );
};

export default DriverDash;