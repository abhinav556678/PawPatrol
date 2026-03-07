import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, CheckCircle, MapPin, Phone } from 'lucide-react';

const DriverDash = () => {
  const socket = useContext(SocketContext);
  const [activeRescue, setActiveRescue] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // 🚨 The diagnostic light

  const myDriverId = 'ambulance-1'; 

  // 1. Listen for connection status AND assigned rescues
  useEffect(() => {
    if (!socket) return;

    // Check if we are connected right now
    if (socket.connected) setIsConnected(true);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('rescueAssigned', (data) => {
      if (data.driverId === myDriverId) {
        // 🚨 Force a giant alert on your phone so we know it heard the message!
        alert("📡 RADIO BEEP: Server sent you a new rescue mission!");
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio block:", e));
        
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

    if (!navigator.geolocation) {
      alert("GPS Blocked! Please check your browser location permissions.");
      return;
    }

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
      // 🚨 FIXED URL: Added http:// and port :5001
      await fetch(`http://10.124.59.40:5001/api/reports/${activeRescue._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to update status on server:", error);
    }

    if (newStatus === 'Resolved') setActiveRescue(null); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-md mx-auto border-x-4 border-gray-200 shadow-2xl">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-3 italic text-gray-800">
        <Truck className="text-orange-500" /> Driver Terminal
      </h1>

      {/* 🚨 THE LIVE CONNECTION LIGHT 🚨 */}
      <div className={`mb-6 font-bold text-sm p-3 rounded-lg border text-center shadow-sm transition-colors duration-300 ${isConnected ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
        {isConnected ? '🟢 RADIO CONNECTED' : '🔴 RADIO OFFLINE (Check IP/Server)'}
      </div>

      {activeRescue ? (
        <div className="space-y-6">
          {/* THE MISSION MAP */}
          <div className="h-[250px] w-full rounded-2xl overflow-hidden border-4 border-orange-500 shadow-lg relative z-0">
            <MapContainer 
              center={[activeRescue.location.lat, activeRescue.location.lng]} 
              zoom={16} 
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[activeRescue.location.lat, activeRescue.location.lng]}>
                <Popup>Emergency Location</Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Mission Details */}
          <div className="border-2 border-orange-500 p-6 rounded-3xl bg-white shadow-md">
            <h2 className="text-2xl font-black text-gray-900">{activeRescue.animalType} Rescue</h2>
            <p className="text-gray-600 mt-1">{activeRescue.description}</p>
            
            <div className="mt-4 p-3 bg-orange-50 rounded-xl flex items-center gap-3 border border-orange-200">
              <div className="bg-orange-200 p-2 rounded-full"><Phone size={18} className="text-orange-700"/></div>
              <div>
                <p className="text-xs text-orange-600 font-bold uppercase">Reporter Phone</p>
                <p className="text-sm font-bold text-gray-800">{activeRescue.reporterPhone || "Not provided"}</p>
              </div>
            </div>

            <div className="grid gap-3 mt-6">
              <button onClick={() => updateStatus('Arrived')} className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${activeRescue.status === 'Arrived' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <MapPin size={20} /> I have Arrived
              </button>
              <button onClick={() => updateStatus('Resolved')} className="p-4 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white mt-2 shadow-lg transition">
                <CheckCircle size={20} /> Animal Secured
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl text-gray-400 font-medium">
          Waiting for dispatch assignment...
        </div>
      )}
    </div>
  );
};

export default DriverDash;