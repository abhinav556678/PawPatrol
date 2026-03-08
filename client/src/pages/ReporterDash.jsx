import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Truck, MapPin, CheckCircle, AlertCircle, LocateFixed, Activity, Camera } from 'lucide-react';

// 🎯 1. THE LOCATE CONTROL (Helper)
const LocateControl = ({ setPosition }) => {
  const map = useMap();
  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 16, { animate: true, duration: 1.5 });
      if (setPosition) setPosition(e.latlng);
    });
  };
  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute bottom-5 right-5 z-[1000] bg-white p-3 rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 text-blue-600 transition-all active:scale-90"
    >
      <LocateFixed size={24} />
    </button>
  );
};

// 📍 2. THE LOCATION PICKER (Helper)
const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) { setPosition(e.latlng); },
  });
  return position ? <Marker position={position}></Marker> : null;
};

// 🚥 3. THE STATUS TRACKER (UI)
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
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-orange-500 z-0 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((step, index) => (
          <div key={step.name} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
              index <= currentIndex ? 'bg-orange-500 border-orange-200 text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              <step.icon size={18} />
            </div>
            <span className="mt-2 text-xs font-bold text-gray-500">{step.name}</span>
          </div>
        ))}
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
  const [preview, setPreview] = useState(null); // 📸 NEW: For image preview
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🔌 TIP: Replace 'localhost' with your IP (e.g., 192.168.x.x) for mobile demo
  const SERVER_URL = "http://localhost:5001"; 

  const fetchMyReports = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/reports`);
      const data = await response.json();
      setMyReports(data);
    } catch (error) { console.error("Fetch error:", error); }
  };

  useEffect(() => {
    fetchMyReports();
    const interval = setInterval(fetchMyReports, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const isFormValid = animalType.trim() !== '' && description.trim() !== '' && position !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsAnalyzing(true);
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
        alert("🚨 Emergency Reported! AI priority assigned.");
        setAnimalType('');
        setDescription('');
        setPosition(null); 
        setPhoto(null);
        setPreview(null); // Clear preview after success
        fetchMyReports(); 
      }
    } catch (error) { console.error("Submit error:", error); } 
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2 border-b-2 border-gray-200 pb-4">
          <AlertCircle className="text-red-500" /> Dispatch Animal Rescue
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {/* MAP */}
          <div className="space-y-2">
            <label className="font-bold text-gray-700 uppercase text-xs tracking-wider">1. Pin Location</label>
            <div className="h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border-2 border-gray-200 z-0 relative">
              <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
                <LocateControl setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
            <div className="space-y-2">
              <label className="font-bold text-gray-700 uppercase text-xs tracking-wider">2. Emergency Details</label>
              <select 
                value={animalType} 
                onChange={e => setAnimalType(e.target.value)} 
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none bg-white font-bold text-sm"
              >
                <option value="" disabled>Select Severity...</option>
                <option value="🚨 Critical Emergency">🚨 Critical Emergency</option>
                <option value="✅ Normal Report">✅ Normal Report</option>
              </select>
            </div>

            <textarea 
              value={description} 
              placeholder="Describe the injury..." 
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none h-24 resize-none text-sm" 
              onChange={e => setDescription(e.target.value)}
            ></textarea>
            
            {/* CAMERA SECTION */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual Evidence</label>
              <div className="flex gap-3">
                <input type="file" id="camera-input" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                <label 
                  htmlFor="camera-input"
                  className="flex-1 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-100 transition-all"
                >
                  <div className="bg-indigo-600 p-2 rounded-full text-white shadow-lg"><Camera size={20} /></div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase">Open Camera</span>
                </label>

                <div className="w-24 h-24 rounded-2xl border-2 border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center shadow-inner">
                  {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-300 font-bold">No Photo</span>}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isAnalyzing}
              className={`w-full font-black p-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isAnalyzing ? 'bg-indigo-600 animate-pulse' : 'bg-red-500 hover:bg-red-600'
              } text-white`}
            >
              {isAnalyzing ? <><Activity className="animate-spin" /> 🧠 AI SCANNING...</> : "🚨 SUBMIT REQUEST"}
            </button>
          </form>
        </div>

        {/* FEED */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">My Live Reports</h2>
          {myReports.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl text-gray-400 border border-dashed">No active reports.</div>
          ) : (
            myReports.map((report) => (
              <div key={report._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">{report.animalType}</h3>
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