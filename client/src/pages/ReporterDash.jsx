import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Truck, MapPin, CheckCircle, AlertCircle, LocateFixed, Activity } from 'lucide-react';

// 🎯 1. THE LOCATE CONTROL (The "Find Me" Brain)
const LocateControl = ({ setPosition }) => {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 16, {
        animate: true,
        duration: 1.5, 
      });
      if (setPosition) setPosition(e.latlng);
    });
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute bottom-5 right-5 z-[1000] bg-white p-3 rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 text-blue-600 transition-all active:scale-90"
      title="Find my location"
    >
      <LocateFixed size={24} />
    </button>
  );
};

// 📍 2. THE LOCATION PICKER
const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position}></Marker> : null;
};

// 🚥 3. THE STATUS TRACKER
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

// 🚀 4. THE MAIN COMPONENT
const ReporterDash = () => {
  const [myReports, setMyReports] = useState([]);
  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(null);
  const [showError, setShowError] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 🚨 New loading state

  // 🔌 REPLACE 'localhost' with your laptop's Wi-Fi IP (e.g., 192.168.1.XX)
  const SERVER_URL = "http://localhost:5001"; 

  const fetchMyReports = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/reports`);
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
    if (!isFormValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsAnalyzing(true); // 🚨 Start AI Scanning Animation

    const formData = new FormData();
    formData.append('animalType', animalType);
    formData.append('description', description);
    formData.append('location', JSON.stringify(position)); 
    if (photo) formData.append('photo', photo);

    try {
      const response = await fetch(`${SERVER_URL}/api/reports`, {
        method: 'POST',
        body: formData 
      });

      if (response.ok) {
        setAnimalType('');
        setDescription('');
        setPosition(null); 
        setPhoto(null);
        setShowError(false);
        fetchMyReports(); 
      }
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setIsAnalyzing(false); // 🚨 Stop Animation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2 border-b-2 border-gray-200 pb-4">
          <AlertCircle className="text-red-500" /> Dispatch Animal Rescue
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          
          <div className="space-y-2">
            <label className="font-bold text-gray-700">1. Click Map or use GPS</label>
            <div className="h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border-2 border-gray-200 z-0 relative">
              <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
                <LocateControl setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-end">
            <div className="space-y-2">
              <label className="font-bold text-gray-700">2. Emergency Details</label>
              <select 
                value={animalType}
                onChange={e => setAnimalType(e.target.value)} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-white font-bold"
                required
              >
                <option value="" disabled>Select Severity...</option>
                <option value="🚨 Critical Emergency">🚨 Critical Emergency</option>
                <option value="✅ Normal Report">✅ Normal Report</option>
              </select>
            </div>

            <textarea 
              value={description}
              placeholder="Describe the injury..." 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none h-28 resize-none" 
              onChange={e => setDescription(e.target.value)}
              required
            ></textarea>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Capture Incident Photo
              </label>
              <input 
                type="file" 
                accept="image/*"
                capture="environment" // 🚨 This triggers the CAMERA on mobile!
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full p-2 text-sm border-2 border-gray-100 rounded-xl file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-lg file:font-bold file:px-4"
              />
            </div>

            {showError && (
              <div className="text-red-500 text-sm font-bold text-center animate-bounce">
                Please pin the location on the map first!
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAnalyzing}
              className={`w-full font-black p-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                isAnalyzing ? 'bg-indigo-600 animate-pulse' : 'bg-red-500 hover:bg-red-600'
              } text-white`}
            >
              {isAnalyzing ? (
                <>
                  <Activity className="animate-spin" /> 🧠 AI ANALYZING SCENE...
                </>
              ) : (
                "🚨 SUBMIT RESCUE REQUEST"
              )}
            </button>
          </form>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Active Tracking</h2>
          {myReports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">{report.animalType}</h3>
              <StatusTracker currentStatus={report.status || 'Pending'} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
const [preview, setPreview] = useState(null);

const handlePhotoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setPhoto(file);
    setPreview(URL.createObjectURL(file)); // Shows a tiny preview to the user
  }
};

// Inside your JSX:
<div className="space-y-3">
  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
    Visual Evidence (Required for AI Triage)
  </label>
  
  <div className="flex gap-3">
    {/* The Hidden Input */}
    <input 
      type="file" 
      id="camera-input"
      accept="image/*"
      capture="environment" 
      onChange={handlePhotoChange}
      className="hidden"
    />
    
    {/* The Styled Button */}
    <label 
      htmlFor="camera-input"
      className="flex-1 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-100 transition-all"
    >
      <div className="bg-indigo-600 p-2 rounded-full text-white shadow-lg">
        <Camera size={20} />
      </div>
      <span className="text-xs font-black text-indigo-700 uppercase">Open Camera</span>
    </label>

    {/* The Preview Square */}
    <div className="w-24 h-24 rounded-2xl border-2 border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
      {preview ? (
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] text-gray-300 font-bold text-center">No Photo<br/>Yet</span>
      )}
    </div>
  </div>
</div>

export default ReporterDash;