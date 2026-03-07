import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SocketContext } from '../context/SocketContext.jsx'; 
import { Bell } from 'lucide-react';

const NgoDash = () => {
  const socket = useContext(SocketContext);
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]); 

  // 1. Initial Data Fetch (Runs once on mount)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const driverRes = await fetch('http://10.124.59.40:5001/api/drivers');
        const driverData = await driverRes.json();
        setDrivers(driverData);

        const reportRes = await fetch('http://10.124.59.40:5001/api/reports');
        const reportData = await reportRes.json();
        setReports(reportData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchData();
  }, []);

  // 2. Real-Time Socket Listeners
  useEffect(() => {
    if (!socket) return;

    // A. Listen for new emergency reports
    socket.on('newRescueReport', (data) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play blocked:", e)); 
      setReports((prev) => [data, ...prev]);
    });

    // B. Listen for moving ambulances (The Live Tracker)
    socket.on('updateMap', (gpsData) => {
      console.log("📍 NGO Map received move for:", gpsData.driverId);

      setDrivers(prevDrivers => {
        // Check if the driver already exists in our local list
        const driverExists = prevDrivers.find(d => d._id === gpsData.driverId || d.id === gpsData.driverId);

        if (driverExists) {
          // Update the existing driver's coordinates
          return prevDrivers.map(d => 
            (d._id === gpsData.driverId || d.id === gpsData.driverId)
              ? { ...d, currentLocation: { lat: gpsData.lat, lng: gpsData.lng } }
              : d
          );
        } else {
          // GHOST FIX: If driver isn't in list (like 'ambulance-1'), add them dynamically!
          return [...prevDrivers, {
            _id: gpsData.driverId,
            name: "Active Ambulance (Live)",
            currentLocation: { lat: gpsData.lat, lng: gpsData.lng },
            phone: "Live Tracking"
          }];
        }
      });
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('newRescueReport');
      socket.off('updateMap'); 
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center bg-white p-6 rounded-xl shadow-md border-t-4 border-orange-500">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="text-orange-500 animate-pulse" /> Paws & Claws Command Center
          </h1>
          <div className="text-lg font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
            {drivers.length} Ambulances Active
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDE: The Live Map */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
            <div className="h-[600px] w-full rounded-lg overflow-hidden relative">
              <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {drivers.map((driver) => (
                  <Marker 
                    key={driver._id} 
                    position={[
                        driver.currentLocation?.lat || 12.8230,
                        driver.currentLocation?.lng || 80.0450
                    ]}
                  >
                    <Popup>
                      <div className="font-bold text-lg">{driver.name}</div>
                      <div className="text-sm text-gray-600">📞 {driver.phone}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* RIGHT SIDE: The Emergency Feed */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 flex flex-col h-[600px] overflow-y-auto">
            <h2 className="text-xl font-black text-gray-800 mb-4 border-b pb-2">Live Emergencies</h2>
            
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                  Scanning for emergencies...
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report._id} className="p-4 border-2 border-red-100 bg-red-50 rounded-xl flex flex-col gap-3 shadow-sm">
                    <div>
                      <h3 className="font-bold text-lg text-red-700">{report.animalType || "Emergency"}</h3>
                      <p className="text-sm text-gray-700 line-clamp-2">{report.description}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <select 
                        id={`driver-select-${report._id}`}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Ambulance...</option>
                        {drivers.map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                        <option value="ambulance-1">Ambulance 1 (Demo)</option> 
                      </select>
                      
                      <button 
                        onClick={() => {
                          const selectedDriver = document.getElementById(`driver-select-${report._id}`).value;
                          if (!selectedDriver) return alert("Pick a driver first!");
                          
                          socket.emit('assignRescue', { driverId: selectedDriver, report: report });
                          setReports(prev => prev.filter(r => r._id !== report._id));
                        }} 
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NgoDash;