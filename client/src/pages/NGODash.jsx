import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SocketContext } from '../context/SocketContext.jsx'; 
import { Bell, AlertTriangle, Cpu, Activity, LocateFixed } from 'lucide-react';

// 🎯 1. THE LOCATE CONTROL (The "Find Me" Brain)
const LocateControl = () => {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      // Smoothly fly to the NGO's current location
      map.flyTo(e.latlng, 15, {
        animate: true,
        duration: 1.5, 
      });
    });
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute bottom-5 right-5 z-[1000] bg-white p-3 rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 text-red-500 transition-all active:scale-90"
      title="Center on my location"
    >
      <LocateFixed size={24} />
    </button>
  );
};

// 🎨 2. CUSTOM ICONS (Pulsating Paws & Ambulances)
const createEmergencyIcon = (isCritical) => {
  const bgColor = isCritical ? 'bg-red-500' : 'bg-orange-500';
  const shadowColor = isCritical ? 'shadow-red-500/50' : 'shadow-orange-500/50';

  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-14 h-14">
        <span class="absolute inline-flex h-full w-full rounded-full ${bgColor} opacity-40 animate-ping"></span>
        <div class="relative flex items-center justify-center w-10 h-10 ${bgColor} border-2 border-white rounded-full shadow-lg ${shadowColor} z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
            <path d="M12 2c-1.7 0-3 1.5-3 3.5S10.3 9 12 9s3-1.5 3-3.5S13.7 2 12 2zM7.5 7c-1.4 0-2.5 1.3-2.5 3S6.1 13 7.5 13s2.5-1.3 2.5-3S8.9 7 7.5 7zM16.5 7c-1.4 0-2.5 1.3-2.5 3s1.1 3 2.5 3 2.5-1.3 2.5-3S17.9 7 16.5 7zM12 11c-2.5 0-5 1.5-6 4-.5 1.3-.5 3.5 1 5 1 .9 2.5 1.5 5 1.5s4-.6 5-1.5c1.5-1.5 1.5-3.7 1-5-1-2.5-3.5-4-6-4z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

const createAmbulanceIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 z-20">
        <div class="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
        <div class="relative flex items-center justify-center w-9 h-9 bg-white border-2 border-blue-600 rounded-full shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-blue-600">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};



// 🚀 3. MAIN NGO DASHBOARD
const NgoDash = () => {
  const socket = useContext(SocketContext);
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]); 
  const [showHeatmap, setShowHeatmap] = useState(false);

  const fetchData = async () => {
    try {
      const driverRes = await fetch('http://localhost:5001/api/drivers');
      const driverData = await driverRes.json();
      setDrivers(driverData);

      const reportRes = await fetch('http://localhost:5001/api/reports');
      const reportData = await reportRes.json();
      setReports(reportData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('updateMap', (gpsData) => {
      setDrivers(prevDrivers => {
        const driverExists = prevDrivers.find(d => d._id === gpsData.driverId || d.id === gpsData.driverId);
        if (driverExists) {
          return prevDrivers.map(d => 
            (d._id === gpsData.driverId || d.id === gpsData.driverId)
              ? { ...d, currentLocation: { lat: gpsData.lat, lng: gpsData.lng } }
              : d
          );
        } else {
          return [...prevDrivers, {
            _id: gpsData.driverId,
            name: "Active Ambulance (Live)",
            currentLocation: { lat: gpsData.lat, lng: gpsData.lng },
            phone: "Live Tracking"
          }];
        }
      });
    });

    return () => {
      socket.off('updateMap'); 
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-6 flex justify-between items-center bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Bell className="text-red-500 animate-bounce" /> Command Center
            </h1>
            <p className="text-sm text-gray-400 font-bold ml-10">Real-time Triage & Deployment</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm border-2 ${
                showHeatmap 
                  ? 'bg-red-500 text-white border-red-400' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-red-200'
              }`}
            >
              <Activity size={18} className={showHeatmap ? 'animate-pulse' : ''} />
              City Immune System
            </button>

            <div className="text-lg font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              {drivers.length} Ambulances Active
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MAP SECTION */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            <div className="h-[750px] w-full rounded-lg overflow-hidden relative z-0">
              <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* 🎯 "Find Me" button inside the map */}
                <LocateControl />

                {/* 1. Ambulances */}
                {drivers.map((driver) => (
                  <Marker 
                    key={`driver-${driver._id}`} 
                    position={[driver.currentLocation?.lat || 12.823, driver.currentLocation?.lng || 80.045]}
                    icon={createAmbulanceIcon()}
                  >
                    <Popup>
                      <div className="font-bold text-lg">{driver.name}</div>
                      <div className="text-sm text-gray-600">📞 {driver.phone}</div>
                    </Popup>
                  </Marker>
                ))}

                {/* 2. Emergencies */}
                {reports.map((report) => {
                  if (!report.location || !report.location.lat) return null;
                  return (
                    <Marker 
                      key={`report-${report._id}`} 
                      position={[report.location.lat, report.location.lng]}
                      icon={createEmergencyIcon(report.priority >= 8)}
                    >
                      <Popup>
                        <div className="font-bold text-lg">{report.animalType}</div>
                        <p className="text-sm font-mono text-gray-600 border-t pt-2 mt-2">{report.aiSummary}</p>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* 3. Heatmap Layer */}
                {showHeatmap && reports.map((r) => (
                  <Circle
                    key={`heat-${r._id}`}
                    center={[r.location.lat, r.location.lng]}
                    radius={250}
                    pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.15, stroke: false }}
                  />
                ))}
              </MapContainer>
            </div>
          </div>

          {/* TRIAGE FEED SECTION */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col h-[750px] overflow-hidden">
            <h2 className="text-xl font-black text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" /> Live Triage Feed
            </h2>
            
            <div className="space-y-4 overflow-y-auto pr-2 pb-4">
              {reports.map((report) => (
                <div key={report._id} className={`p-4 border-2 rounded-xl flex flex-col gap-3 shadow-sm ${report.priority >= 8 ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div>
                    <h3 className={`font-black text-xl ${report.priority >= 8 ? 'text-red-700' : 'text-gray-800'}`}>{report.animalType}</h3>
                    <p className="text-sm text-gray-700 line-clamp-2 mt-1">{report.description}</p>
                  </div>
                  
                  {report.photoUrl && (
                    <img src={`http://localhost:5001${report.photoUrl}`} alt="Incident" className="w-full h-32 object-cover rounded-md border" />
                  )}

                  <div className="flex items-start gap-2 text-xs font-mono text-indigo-700 bg-indigo-50 p-2 rounded">
                    <Cpu size={14} className="mt-0.5" />
                    <span>{report.aiSummary}</span>
                  </div>

                  <div className="flex gap-2">
                    <select id={`driver-select-${report._id}`} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Select Ambulance...</option>
                      {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      <option value="ambulance-1">Ambulance 1 (Demo)</option>
                    </select>
                    <button 
                      onClick={() => {
                        const selectedDriver = document.getElementById(`driver-select-${report._id}`).value;
                        if (!selectedDriver) return alert("Select a driver!");
                        socket.emit('assignRescue', { driverId: selectedDriver, report });
                        setReports(prev => prev.filter(r => r._id !== report._id));
                      }}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow-md transition whitespace-nowrap"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
const PriorityBar = ({ level }) => {
  const percentage = (level / 10) * 100;
  // Dynamic color based on AI assessment
  const color = level >= 8 ? 'bg-red-500' : level >= 5 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default NgoDash;