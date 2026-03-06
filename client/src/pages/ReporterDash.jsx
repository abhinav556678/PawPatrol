import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, MapPin, Camera, Send, ImagePlus, Navigation, Building2, Stethoscope } from 'lucide-react';

// --- CUSTOM ICONS ---
const ngoIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 16px;">🏢</div>`,
  className: 'custom-map-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const clinicIcon = L.divIcon({
  html: `<div style="background-color: #14b8a6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 16px;">🏥</div>`,
  className: 'custom-map-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// --- DISTANCE CALCULATOR (Haversine Formula) ---
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return (R * c).toFixed(1); // Returns distance in km with 1 decimal
}

// --- MOCK DATABASE (Bengaluru area) ---
const MOCK_FACILITIES = [
  { id: 1, name: "Blue Cross Rescue", type: "NGO", lat: 12.98, lng: 77.60 },
  { id: 2, name: "City Vet Emergency", type: "Clinic", lat: 12.96, lng: 77.58 },
  { id: 3, name: "Paws & Hearts Shelter", type: "NGO", lat: 12.95, lng: 77.62 },
  { id: 4, name: "Sunrise Animal Hospital", type: "Clinic", lat: 12.99, lng: 77.57 },
  { id: 5, name: "Faraway Sanctuary", type: "NGO", lat: 13.05, lng: 77.70 }, // Intentionally far to test the radius
];

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition(e.latlng); },
  });
  return position === null ? null : (
    <Marker position={position}>
      <Popup>Emergency Location Pinned!</Popup>
    </Marker>
  );
}

export default function ReporterDash() {
  const mapRef = useRef(null);
  const defaultCenter = [12.9716, 77.5946]; 
  const [position, setPosition] = useState(null); 
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  
  const [formData, setFormData] = useState({
    animalType: '',
    description: '',
    photo: null,
  });

  // Automatically recalculate nearby facilities when the pin moves
  useEffect(() => {
    if (position) {
      const radiusInKm = 10; // Only show places within 10km
      
      const calculated = MOCK_FACILITIES.map(facility => ({
        ...facility,
        distance: getDistance(position.lat, position.lng, facility.lat, facility.lng)
      }))
      .filter(facility => parseFloat(facility.distance) <= radiusInKm)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); // Sort closest first

      setNearbyFacilities(calculated);
    }
  }, [position]);

  const handleLocateMe = (e) => {
    e.preventDefault();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const newPos = { lat: location.coords.latitude, lng: location.coords.longitude };
          setPosition(newPos);
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 14, { animate: true, duration: 1.5 });
          }
        },
        () => alert("Couldn't access your GPS. Please allow location permissions.")
      );
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, photo: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!position) {
      return alert("📍 Please drop a pin on the map to set the rescue location.");
    }

    // 1. Package the data into FormData (required for image uploads)
    const submitData = new FormData();
    submitData.append('animalType', formData.animalType);
    submitData.append('description', formData.description);
    
    // Convert the GPS object into a string for the backend to parse
    submitData.append('location', JSON.stringify(position));
    
    // Only attach the photo if the user uploaded one
    if (formData.photo) {
      submitData.append('photo', formData.photo);
    }

    try {
      // 2. Send it to your backend port 5000
      const response = await fetch('http://localhost:5001/api/reports', {
        method: 'POST',
        body: submitData, // Note: We do NOT set 'Content-Type' when using FormData
      });

      const data = await response.json();

      if (response.ok) {
        alert('🚨 Rescue report dispatched successfully!');
        console.log('Server confirmed:', data);
        
        // 3. Reset the form for the next emergency
        setFormData({ animalType: '', description: '', photo: null });
        setPosition(null);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to connect to the server. Is port 5000 running?');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col h-screen">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
        
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <AlertCircle className="text-orange-500 h-8 w-8" />
            Active Rescue Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Report animals in need. Dropping a pin reveals nearby help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
          
          {/* Left Column: Form & Nearby List */}
          <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Form Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Camera className="text-orange-500" /> New Report
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input type="text" placeholder="What animal is it? (e.g. Stray dog)" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" value={formData.animalType} onChange={(e) => setFormData({...formData, animalType: e.target.value})} required />
                </div>
                <div>
                  <textarea rows="2" placeholder="Condition? (e.g. Injured leg)" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required></textarea>
                </div>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-12 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <ImagePlus size={18} /> {formData.photo ? formData.photo.name : "Add Photo"}
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-colors">
                  <Send className="h-5 w-5" /> Dispatch Request
                </button>
              </form>
            </div>

            {/* Nearby Facilities List (Scrollable) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-grow overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex justify-between items-center">
                Nearby Help 
                {position && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">{nearbyFacilities.length} found</span>}
              </h3>
              
              {!position ? (
                <div className="text-center text-gray-400 py-8">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Drop a pin to see nearby <br/>NGOs and Clinics (10km radius)</p>
                </div>
              ) : nearbyFacilities.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No facilities found within 10km.</p>
              ) : (
                <ul className="space-y-3">
                  {nearbyFacilities.map(facility => (
                    <li key={facility.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-300 transition-colors">
                      <div className="flex items-center gap-3">
                        {facility.type === 'NGO' ? <Building2 className="text-blue-500" size={20} /> : <Stethoscope className="text-teal-500" size={20} />}
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{facility.name}</p>
                          <p className="text-xs text-gray-500">{facility.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-orange-600">{facility.distance} km</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-2 relative rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full min-h-[500px]">
            <button onClick={handleLocateMe} type="button" className="absolute top-4 right-4 z-[400] bg-white text-gray-800 p-3 rounded-full shadow-lg hover:text-orange-500 transition-all border border-gray-200 flex items-center gap-2 font-medium">
              <Navigation size={20} className="text-orange-500" /> Find Me
            </button>

            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} ref={mapRef} className="w-full h-full z-10">
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* The User's Pin */}
              <LocationMarker position={position} setPosition={setPosition} />

              {/* The Facility Markers */}
              {position && nearbyFacilities.map(facility => (
                <Marker 
                  key={facility.id} 
                  position={[facility.lat, facility.lng]} 
                  icon={facility.type === 'NGO' ? ngoIcon : clinicIcon}
                >
                  <Popup>
                    <strong>{facility.name}</strong><br/>
                    {facility.type} • {facility.distance} km away
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

        </div>
      </div>
    </div>
  );
}