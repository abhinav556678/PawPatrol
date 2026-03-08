import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 

const ReportEmergency = () => {
    // 1. STATE MANAGEMENT
    const [animalType, setAnimalType] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState({ lat: 12.823, lng: 80.045 }); 

    // 2. THE AI SUBMISSION LOGIC
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('animalType', animalType);
        formData.append('description', description);
        formData.append('location', JSON.stringify(location)); 
        
        // 🚨 Crucial for AI Vision
        if (photo) {
            formData.append('photo', photo);
        }

        try {
            const response = await fetch('http://localhost:5001/api/reports', {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const result = await response.json();
                console.log("AI Analysis Result:", result);
                alert("AI Dispatch Successful! Priority assigned.");
                // Clear form after success
                setAnimalType('');
                setDescription('');
                setPhoto(null);
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to send report.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 font-sans">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-red-500">①</span> Dispatch Animal Rescue
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                
                {/* LEFT SIDE: MAP */}
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">1. Click Map to Pin Location</label>
                    {/* Added overflow-hidden so the map respects the rounded corners */}
                    <div className="bg-gray-200 h-64 rounded-xl border border-gray-300 overflow-hidden relative">
                        <MapContainer 
                            center={[location.lat, location.lng]} 
                            zoom={15} 
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[location.lat, location.lng]} />
                        </MapContainer>
                    </div>
                </div>

                {/* RIGHT SIDE: EMERGENCY DETAILS */}
                <div className="flex-1 flex flex-col gap-4">
                    <label className="block text-sm font-semibold text-gray-700">2. Emergency Details</label>
                    
                    {/* Animal Type Input */}
                    <input 
                        type="text" 
                        placeholder="Animal Type (e.g., Dog, Cow)" 
                        value={animalType}
                        onChange={(e) => setAnimalType(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                        required
                    />

                    {/* Description Textarea */}
                    <textarea 
                        placeholder="Describe the injury or situation..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                        required
                    />

                    {/* 🚨 PHOTO UPLOAD INPUT 🚨 */}
                    <div className="w-full">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                            Upload Incident Photo (For AI Scan)
                        </label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files[0])}
                            className="w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="w-full bg-red-400 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2 mt-auto"
                    >
                        🚨 Submit Rescue Request
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReportEmergency;