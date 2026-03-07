import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Truck, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position}></Marker> : null;
};

const ReporterDash = () => {
  const [myReports, setMyReports] = useState([]);
  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(null);
  
  // 🚨 NEW: State to control our custom warning message
  const [showError, setShowError] = useState(false);

  const fetchMyReports = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/reports');
      const data = await response.json();
      setMyReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  useEffect(() => {
    fetchMyReports();
    const interval = setInterval(fetchMyReports, 5000); 
    return () => clearInterval(interval);
  }, []);

  const isFormValid = animalType.trim() !== '' && description.trim() !== '' && position !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🚨 NEW: If they click while invalid, show the message and stop the function
    if (!isFormValid) {
      setShowError(true);
      // Automatically hide the message after 3 seconds so it doesn't get annoying
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    try {
      await fetch('http://localhost:5001/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalType,
          description,
          location: JSON.stringify(position) 
        })
      });
      
      alert("🚨 Emergency Reported!");
      
      // Reset everything after success
      setAnimalType('');
      setDescription('');
      setPosition(null); 
      setShowError(false);
      fetchMyReports(); 
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const StatusTracker = ({ currentStatus }) => {
    const steps = [
      { name: 'Pending', icon: Clock },
      { name: 'Dispatched', icon: Truck },
      { name: 'Arrived', icon: MapPin },
      { name: 'Resolved', icon: CheckCircle }
    ];

    let currentIndex = steps.findIndex(s => s.name === currentStatus);
    if (currentIndex === -1) currentIndex = 0;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-orange-500 z-0 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.name} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted ? 'bg-orange-500 border-orange-200 text-white' : 'bg-white border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-orange-100 scale-110' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className={`mt-2 text-xs font-bold ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2 border-b-2 border-gray-200 pb-4">
          <AlertCircle className="text-red-500" /> Dispatch Animal Rescue
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          <div className="space-y-2">
            <label className="font-bold text-gray-700">1. Click Map to Pin Location</label>
            <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-gray-200 z-0 relative">
              <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-end">
            <div className="space-y-2">
              <label className="font-bold text-gray-700">2. Emergency Details</label>
              <input 
                type="text" 
                value={animalType}
                placeholder="Animal Type (e.g., Dog, Cow)" 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none" 
                onChange={e => setAnimalType(e.target.value)} 
              />
            </div>
            <textarea 
              value={description}
              placeholder="Describe the injury or situation..." 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none h-32 resize-none" 
              onChange={e => setDescription(e.target.value)}
            ></textarea>
            
            {/* 🚨 THE NEW WARNING MESSAGE */}
            {showError && (
              <div className="text-red-500 text-sm font-bold text-center animate-bounce">
                Please provide animal details and click the map first!
              </div>
            )}

            {/* 🚨 THE TRANSLUCENT BUTTON */}
            <button 
              type="submit" 
              className={`w-full font-bold p-4 rounded-xl shadow-md transition-all duration-300 bg-red-500 text-white ${
                isFormValid 
                  ? 'hover:bg-red-600 scale-100 opacity-100' 
                  : 'opacity-50 hover:opacity-60 cursor-pointer'
              }`}
            >
              🚨 Submit Rescue Request
            </button>
          </form>

        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-2xl font-bold text-gray-800">My Live Reports</h2>
          
          {myReports.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl text-gray-500 border border-gray-200">
              You have no active rescue reports.
            </div>
          ) : (
            myReports.map((report) => (
              <div key={report._id} className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{report.animalType || 'Emergency'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                  <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                    ID: {report._id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <StatusTracker currentStatus={report.status || 'Pending'} />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ReporterDash;