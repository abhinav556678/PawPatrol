import React, { useState, useEffect, useContext, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SocketContext } from '../context/SocketContext.jsx';

// Custom red pin
const createRedPinIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div style="position:relative;width:30px;height:42px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42">
          <defs>
            <filter id="pinShadow" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
            </filter>
          </defs>
          <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#C0392B" filter="url(#pinShadow)"/>
          <circle cx="15" cy="14" r="6" fill="white" opacity="0.9"/>
        </svg>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

const createAmbulanceIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 z-[1000]">
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
      ⊕
    </button>
  );
};

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position ? <Marker position={position} icon={createRedPinIcon()}></Marker> : null;
};

// Status steps
const StatusTracker = ({ currentStatus }) => {
  const steps = ['Pending', 'Dispatched', 'Arrived', 'Resolved'];
  let idx = steps.indexOf(currentStatus);
  if (idx === -1) idx = 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#6B4226] z-0 rounded-full transition-all duration-500"
          style={{ width: `${(idx / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((step, i) => (
          <div key={step} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 text-sm font-bold ${
              i <= idx ? 'bg-[#6B4226] border-[#D2B48C] text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {i <= idx ? '✓' : i + 1}
            </div>
            <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReporterDash = () => {
  const socket = useContext(SocketContext); 
  const [liveAmbulance, setLiveAmbulance] = useState(null); 

  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active rescue (single rescue flow)
  const [activeRescue, setActiveRescue] = useState(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your AI Rescue Assistant. I can give you first-aid tips while you wait. What happened?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Sidebar & History
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Follow-up notification
  const [followUpNotif, setFollowUpNotif] = useState(null);

  const SERVER_URL = "http://localhost:5001"; 

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/reports/history`);
      if (res.ok) { const data = await res.json(); setHistory(data); }
    } catch (err) { console.error('History error:', err); }
    finally { setHistoryLoading(false); }
  };

  const openSidebar = () => { setSidebarOpen(true); fetchHistory(); };
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (!socket) return;
    socket.on('updateMap', (gpsData) => {
      setLiveAmbulance({ lat: gpsData.lat, lng: gpsData.lng });
    });
    // Real-time status updates from the driver
    socket.on('rescueStatusUpdate', (data) => {
      setActiveRescue(prev => {
        if (prev && prev._id === data.reportId) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });
    // Follow-up report from NGO
    socket.on('caseFollowUp', (data) => {
      setFollowUpNotif(data);
    });
    return () => { socket.off('updateMap'); socket.off('rescueStatusUpdate'); socket.off('caseFollowUp'); };
  }, [socket]);

  // Poll active rescue status
  useEffect(() => {
    if (!activeRescue) return;
    const pollStatus = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/reports/${activeRescue._id}`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          setActiveRescue(prev => ({ ...prev, status: data.status }));
        }
      } catch (err) { console.error("Poll error:", err); }
    };
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [activeRescue?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    const typingId = Date.now();
    setMessages(prev => [...prev, { id: typingId, role: 'bot', text: 'Thinking...' }]);
    try {
      const response = await fetch(`${SERVER_URL}/api/reports/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message: userMsg.text })
      });
      const data = await response.json();
      setMessages(prev => prev.map(msg => msg.id === typingId ? { role: 'bot', text: data.reply } : msg));
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === typingId ? { role: 'bot', text: "Connection error. Stay calm." } : msg));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!animalType || !position) return alert("Please enter a title and pin the location!");
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('animalType', animalType);
    formData.append('description', description);
    formData.append('location', JSON.stringify(position)); 
    if (photo) formData.append('photo', photo);
    try {
      const response = await fetch(`${SERVER_URL}/api/reports`, {
        method: 'POST', headers: getAuthHeader(), body: formData 
      });
      if (response.ok) {
        const data = await response.json();
        const reportId = data.report ? data.report._id : data._id;
        setActiveRescue({ _id: reportId, animalType, description, status: 'Pending', location: position });
        setAnimalType(''); setDescription(''); setPosition(null); setPhoto(null); setPreview(null);
      }
    } catch (error) { console.error("Submit error:", error); } 
    finally { setIsAnalyzing(false); }
  };

  const handleDone = () => { setActiveRescue(null); setLiveAmbulance(null); };

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="rd-sidebar-backdrop" onClick={closeSidebar}></div>}
      <div className={`rd-sidebar ${sidebarOpen ? 'rd-sidebar-open' : ''}`}>
        <div className="rd-sidebar-header">
          <h2 className="rd-sidebar-title">Rescue History</h2>
          <button onClick={closeSidebar} className="rd-sidebar-close">×</button>
        </div>
        <div className="rd-sidebar-body">
          {historyLoading ? (
            <p className="rd-sidebar-empty">Loading...</p>
          ) : history.length === 0 ? (
            <p className="rd-sidebar-empty">No resolved rescues yet.</p>
          ) : (
            history.map((r, i) => (
              <div key={r._id} className="rd-history-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="rd-history-header">
                  <span className="rd-history-name">{r.animalType}</span>
                  <span className="rd-history-badge">Resolved</span>
                </div>
                {r.description && <p className="rd-history-desc">{r.description}</p>}
                <span className="rd-history-date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {r.followUpReport && (
                  <div className="rd-history-followup">
                    <span className="rd-followup-label">NGO Follow-Up</span>
                    <p className="rd-followup-text">{r.followUpReport}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-[#EDE5DA] pb-4">
          <button onClick={openSidebar} className="rd-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-[#3D2B1F]" style={{ fontFamily: "'Playfair Display', serif" }}>
            AniMap <span className="text-base font-normal text-[#8C7B6B] ml-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Rescue</span>
          </h1>
        </div>

        {!activeRescue ? (
          /* ===== DISPATCH FORM ===== */
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EDE5DA] grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MAP */}
            <div className="space-y-2">
              <label className="font-bold text-[#8C7B6B] uppercase text-[10px] tracking-widest">1. Pin Location</label>
              <div className="h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden border-2 border-[#EDE5DA] z-0 relative">
                <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={position} setPosition={setPosition} />
                  <LocateControl setPosition={setPosition} />
                  {liveAmbulance && (
                    <Marker position={[liveAmbulance.lat, liveAmbulance.lng]} icon={createAmbulanceIcon()} />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-bold text-[#8C7B6B] uppercase text-[10px] tracking-widest">2. What happened?</label>
                  <input 
                    type="text"
                    value={animalType} 
                    onChange={e => setAnimalType(e.target.value)} 
                    placeholder="e.g. Dog is stuck, Injured cat found..."
                    className="w-full p-3 border-2 border-[#EDE5DA] rounded-xl focus:border-[#A67B5B] outline-none bg-[#FFFDFB] font-medium text-sm"
                  />
                </div>

                <textarea 
                  value={description} 
                  placeholder="Describe the situation in detail..." 
                  className="w-full p-4 border-2 border-[#EDE5DA] rounded-xl focus:border-[#A67B5B] outline-none h-24 resize-none text-sm bg-[#FFFDFB]" 
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-[#8C7B6B] uppercase tracking-widest">Photo Evidence</label>
                  <div className="flex gap-2">
                    <input type="file" id="cam-cap" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                    <label htmlFor="cam-cap" className="flex-1 bg-[#FFF8F0] border-2 border-dashed border-[#EDE5DA] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#F5EDE4] transition-all">
                      <span className="text-[10px] font-black text-[#6B4226] uppercase">Camera</span>
                    </label>

                    <input type="file" id="gal-up" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <label htmlFor="gal-up" className="flex-1 bg-[#FFF8F0] border-2 border-dashed border-[#EDE5DA] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#F5EDE4] transition-all">
                      <span className="text-[10px] font-black text-[#8C7B6B] uppercase">Gallery</span>
                    </label>

                    <div className="w-16 h-16 rounded-xl border bg-[#FFFDFB] overflow-hidden flex shrink-0 border-[#EDE5DA]">
                      {preview ? <img src={preview} className="w-full h-full object-cover" /> : <div className="m-auto text-[8px] text-[#D2B48C] font-bold">—</div>}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full bg-[#6B4226] text-white font-black p-4 rounded-xl shadow-lg hover:bg-[#5A3720] transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? 'Analyzing...' : 'DISPATCH RESCUE'}
              </button>
            </form>
          </div>
        ) : (
          /* ===== WAITING VIEW ===== */
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EDE5DA] space-y-6 animate-[fadeIn_0.4s_ease]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-[#3D2B1F]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {activeRescue.animalType}
              </h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${
                activeRescue.status === 'Resolved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-[#FFF8F0] text-[#A67B5B]'
              }`}>{activeRescue.status}</span>
            </div>

            {activeRescue.description && <p className="text-sm text-[#8C7B6B]">{activeRescue.description}</p>}

            <StatusTracker currentStatus={activeRescue.status || 'Pending'} />

            {/* Map showing pinned location */}
            {activeRescue.location && (
              <div className="h-[250px] rounded-2xl overflow-hidden border-2 border-[#EDE5DA] z-0">
                <MapContainer center={[activeRescue.location.lat, activeRescue.location.lng]} zoom={15} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[activeRescue.location.lat, activeRescue.location.lng]} icon={createRedPinIcon()} />
                  {liveAmbulance && <Marker position={[liveAmbulance.lat, liveAmbulance.lng]} icon={createAmbulanceIcon()} />}
                </MapContainer>
              </div>
            )}

            {activeRescue.status === 'Resolved' ? (
              <div className="text-center space-y-4 pt-2">
                <p className="text-base font-semibold text-green-700">The animal has been rescued successfully!</p>
                <button onClick={handleDone} className="bg-[#6B4226] text-white font-black py-4 px-12 rounded-xl hover:bg-[#5A3720] transition-all shadow-lg">
                  Done — Report Another
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-[#FFF8F0] rounded-xl border border-[#EDE5DA]">
                <div className="w-3 h-3 rounded-full bg-[#A67B5B] animate-pulse flex-shrink-0"></div>
                <p className="text-sm text-[#6B4226] font-medium">
                  {activeRescue.status === 'Pending' && 'Waiting for a responder to pick up your rescue...'}
                  {activeRescue.status === 'Dispatched' && 'A responder is on the way to the location!'}
                  {activeRescue.status === 'Arrived' && 'The responder has arrived at the scene.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {chatOpen ? (
          <div className="w-[360px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-[#EDE5DA] flex flex-col overflow-hidden animate-[chatSlideUp_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-4 bg-[#6B4226] text-white text-sm font-bold flex justify-between items-center">
              <span>AI First-Aid Assistant</span>
              <button onClick={() => setChatOpen(false)} className="text-xl opacity-70 hover:opacity-100 bg-transparent border-none text-white cursor-pointer">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFDFB] max-h-[320px]">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${
                  m.role === 'bot' ? 'bg-[#F6F1EB] text-[#3D2B1F] rounded-bl-sm' : 'ml-auto bg-[#6B4226] text-white rounded-br-sm'
                }`}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-[#EDE5DA] flex gap-2">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask for tips..."
                className="flex-1 bg-[#F6F1EB] p-3 rounded-xl text-xs outline-none"
              />
              <button onClick={handleSendMessage} className="bg-[#6B4226] text-white px-4 py-2 rounded-xl hover:bg-[#5A3720] transition-colors text-sm font-semibold">Send</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setChatOpen(true)} className="chat-fab-btn group">
            <span className="chat-fab-ring"></span>
            <span className="chat-fab-ring2"></span>
            <svg viewBox="0 0 24 24" fill="none" className="chat-fab-icon">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="white" stroke="white" strokeWidth="1.5"/>
            </svg>
            <span className="chat-fab-label">Need Help?</span>
          </button>
        )}
      </div>

      {/* Follow-up Notification Popup */}
      {followUpNotif && (
        <div className="rd-notif-overlay">
          <div className="rd-notif-card">
            <div className="rd-notif-header">
              <span className="rd-notif-icon">📋</span>
              <h3 className="rd-notif-title">Rescue Follow-Up Report</h3>
            </div>
            <p className="rd-notif-body">{followUpNotif.followUpReport}</p>
            <button className="rd-notif-dismiss" onClick={() => setFollowUpNotif(null)}>
              Got it — Thank you!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes chatSlideUp { from { opacity:0; transform:translateY(20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }

        .chat-fab-btn {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6B4226 0%, #8B5E3C 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 24px rgba(107, 66, 38, 0.35);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
          animation: fabBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .chat-fab-btn:hover {
          transform: scale(1.12);
          box-shadow: 0 8px 32px rgba(107, 66, 38, 0.45);
        }
        @keyframes fabBounceIn {
          0% { opacity: 0; transform: scale(0) translateY(20px); }
          60% { opacity: 1; transform: scale(1.15) translateY(-4px); }
          100% { transform: scale(1) translateY(0); }
        }

        .chat-fab-icon {
          width: 26px;
          height: 26px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
        }

        .chat-fab-ring, .chat-fab-ring2 {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(107, 66, 38, 0.25);
          animation: fabPulse 2.5s ease-out infinite;
        }
        .chat-fab-ring2 {
          inset: -12px;
          animation-delay: 0.8s;
          border-color: rgba(107, 66, 38, 0.12);
        }
        @keyframes fabPulse {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        .chat-fab-label {
          position: absolute;
          right: 72px;
          background: white;
          color: #6B4226;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          padding: 8px 14px;
          border-radius: 10px;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          opacity: 0;
          transform: translateX(8px);
          transition: all 0.25s ease;
          pointer-events: none;
        }
        .chat-fab-btn:hover .chat-fab-label {
          opacity: 1;
          transform: translateX(0);
        }

        /* Hamburger */
        .rd-hamburger {
          width: 36px; height: 36px; background: none; border: none; cursor: pointer;
          display: flex; flex-direction: column; justify-content: center; gap: 5px; padding: 6px;
          border-radius: 8px; transition: background 0.2s;
        }
        .rd-hamburger:hover { background: #F6F1EB; }
        .rd-hamburger span {
          display: block; width: 100%; height: 2.5px; background: #6B4226; border-radius: 2px;
          transition: all 0.3s;
        }

        /* Sidebar */
        .rd-sidebar-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 9990;
          animation: backdropIn 0.25s ease;
        }
        @keyframes backdropIn { from { opacity:0; } to { opacity:1; } }
        .rd-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 340px; max-width: 85vw;
          background: white; z-index: 9991; transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.08);
        }
        .rd-sidebar-open { transform: translateX(0); }
        .rd-sidebar-header {
          padding: 20px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1.5px solid #EDE5DA; flex-shrink: 0;
        }
        .rd-sidebar-title {
          font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 800;
          color: #3D2B1F; margin: 0;
        }
        .rd-sidebar-close {
          width: 32px; height: 32px; border: none; background: #F6F1EB; border-radius: 8px;
          font-size: 20px; color: #6B4226; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: background 0.2s;
        }
        .rd-sidebar-close:hover { background: #EDE5DA; }
        .rd-sidebar-body {
          flex: 1; overflow-y: auto; padding: 16px; display: flex;
          flex-direction: column; gap: 10px;
        }
        .rd-sidebar-empty {
          text-align: center; padding: 40px 16px; color: #D2B48C;
          font-weight: 600; font-size: 14px;
        }

        /* History cards */
        .rd-history-card {
          padding: 14px; border: 1.5px solid #EDE5DA; border-radius: 14px;
          background: #FFFDFB; display: flex; flex-direction: column; gap: 6px;
          animation: cardSlideIn 0.3s ease backwards;
        }
        @keyframes cardSlideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        .rd-history-header { display: flex; justify-content: space-between; align-items: center; }
        .rd-history-name { font-size: 14px; font-weight: 700; color: #3D2B1F; }
        .rd-history-badge {
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          padding: 3px 10px; border-radius: 100px; background: #F0F7ED; color: #4A7A3B;
        }
        .rd-history-desc {
          font-size: 12px; color: #8C7B6B; line-height: 1.4; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .rd-history-date { font-size: 10px; color: #D2B48C; font-weight: 600; }

        /* History follow-up display */
        .rd-history-followup {
          margin-top: 4px; padding: 8px 10px; background: #F0F7ED;
          border: 1px solid #D5E8CF; border-radius: 10px;
        }
        .rd-followup-label {
          display: block; font-size: 9px; font-weight: 700; color: #4A7A3B;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;
        }
        .rd-followup-text {
          font-size: 12px; color: #3D2B1F; line-height: 1.5; margin: 0;
        }

        /* Notification popup */
        .rd-notif-overlay {
          position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.4);
          display: flex; align-items: flex-end; justify-content: center;
          padding: 24px; animation: backdropIn 0.3s ease;
        }
        @keyframes notifSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .rd-notif-card {
          width: 100%; max-width: 440px; background: white;
          border-radius: 20px; padding: 24px; box-shadow: 0 16px 48px rgba(0,0,0,0.12);
          animation: notifSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rd-notif-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .rd-notif-icon { font-size: 28px; }
        .rd-notif-title {
          font-family: 'Playfair Display', serif; font-size: 16px;
          font-weight: 800; color: #3D2B1F; margin: 0;
        }
        .rd-notif-body {
          font-size: 14px; color: #6B4226; line-height: 1.6; margin: 0 0 16px 0;
          padding: 12px; background: #F0F7ED; border-radius: 12px;
          border: 1px solid #D5E8CF;
        }
        .rd-notif-dismiss {
          width: 100%; padding: 12px; background: #4A7A3B; color: white;
          border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: all 0.2s;
        }
        .rd-notif-dismiss:hover { background: #3D6830; }

        .rd-sidebar-body::-webkit-scrollbar { width: 3px; }
        .rd-sidebar-body::-webkit-scrollbar-track { background: transparent; }
        .rd-sidebar-body::-webkit-scrollbar-thumb { background: #D2B48C; border-radius: 4px; }

        @media (max-width: 768px) {
          .min-h-screen { padding: 12px !important; }
          .max-w-6xl { padding: 0; }
          .grid-cols-1.md\\:grid-cols-2 { grid-template-columns: 1fr !important; }
          .h-\\[300px\\].md\\:h-\\[400px\\] { height: 250px !important; }
          .chat-fab-btn { width: 50px; height: 50px; }
          .chat-fab-icon { width: 22px; height: 22px; }
          .chat-fab-ring { inset: -4px; }
          .chat-fab-ring2 { inset: -8px; }
          .w-\\[360px\\] { width: calc(100vw - 32px) !important; }
        }
      `}</style>
    </div>
  );
};

export default ReporterDash;