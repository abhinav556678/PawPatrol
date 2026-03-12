import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Red emergency pin for the rescue target
const createTargetIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div style="position:relative;width:36px;height:48px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="36" height="48">
          <defs>
            <filter id="tpin" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
            </filter>
          </defs>
          <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#C0392B" filter="url(#tpin)"/>
          <circle cx="15" cy="13" r="5.5" fill="white" opacity="0.9"/>
          <line x1="15" y1="10" x2="15" y2="16" stroke="#C0392B" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="13" x2="18" y2="13" stroke="#C0392B" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  });
};

// Blue ambulance icon for driver position
const createDriverIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-14 h-14">
        <div class="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
        <div class="relative flex items-center justify-center w-10 h-10 bg-white border-3 border-blue-600 rounded-full shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-blue-600">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

// Auto-fit map to show both markers
const FitBounds = ({ driverPos, targetPos }) => {
  const map = useMap();
  useEffect(() => {
    if (driverPos && targetPos) {
      const bounds = L.latLngBounds([
        [driverPos.lat, driverPos.lng],
        [targetPos.lat, targetPos.lng]
      ]);
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1 });
      }, 200);
    } else if (targetPos) {
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
        map.flyTo([targetPos.lat, targetPos.lng], 16, { animate: true, duration: 1 });
      }, 200);
    }
  }, [driverPos?.lat, driverPos?.lng, targetPos?.lat, targetPos?.lng]);
  return null;
};

const DriverDash = () => {
  const socket = useContext(SocketContext);
  const [activeRescue, setActiveRescue] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewAlert, setShowNewAlert] = useState(false); 
  const [currentLocation, setCurrentLocation] = useState(null); 

  const SERVER_URL = "http://localhost:5001"; 
  const myDriverId = 'ambulance-1'; 

  // Listen for connection + assigned rescues
  useEffect(() => {
    if (!socket) return;
    if (socket.connected) setIsConnected(true);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('rescueAssigned', (data) => {
      if (data.driverId === myDriverId) {
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 500]);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio block:", e));
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

  // GPS Tracker
  useEffect(() => {
    if (!socket || !activeRescue) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        socket.emit('driverLocationUpdate', { driverId: myDriverId, lat: latitude, lng: longitude });
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, maximumAge: 0 } 
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, activeRescue]);

  const updateStatus = async (newStatus) => {
    if (activeRescue) setActiveRescue({ ...activeRescue, status: newStatus });
    
    // Emit real-time status update via socket so reporter sees it instantly
    if (socket) {
      socket.emit('rescueStatusUpdate', { reportId: activeRescue._id, status: newStatus });
    }

    try {
      await fetch(`${SERVER_URL}/api/reports/${activeRescue._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) { console.error("Failed to update status:", error); }
    if (newStatus === 'Resolved') { setActiveRescue(null); setCurrentLocation(null); }
  };

  // Line from driver to target
  const trackingPath = activeRescue && currentLocation 
    ? [[currentLocation.lat, currentLocation.lng], [activeRescue.location.lat, activeRescue.location.lng]]
    : null;

  // Haversine distance (km)
  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distanceKm = activeRescue && currentLocation 
    ? calcDistance(currentLocation.lat, currentLocation.lng, activeRescue.location.lat, activeRescue.location.lng)
    : null;
  const etaMinutes = distanceKm != null ? Math.max(1, Math.round((distanceKm / 30) * 60)) : null; // 30 km/h avg city speed

  // Status steps
  const statusSteps = ['Dispatched', 'Arrived', 'Resolved'];
  const currentStepIdx = activeRescue ? statusSteps.indexOf(activeRescue.status) : -1;

  return (
    <div className="dd-root">

      {/* EMERGENCY OVERLAY */}
      {showNewAlert && activeRescue && (
        <div className="dd-alert-overlay">
          <div className="dd-alert-content">
            <div className="dd-alert-badge">EMERGENCY</div>
            <h1 className="dd-alert-title">{activeRescue.animalType}</h1>
            <p className="dd-alert-desc">"{activeRescue.description}"</p>
            <button 
              onClick={() => { setShowNewAlert(false); if ("vibrate" in navigator) navigator.vibrate(0); }}
              className="dd-alert-accept"
            >
              ACCEPT MISSION
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="dd-header">
        <div>
          <h1 className="dd-logo">AniMap <span>Driver</span></h1>
        </div>
        <div className={`dd-connection ${isConnected ? 'dd-connected' : 'dd-disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      {activeRescue ? (
        /* ===== ACTIVE RESCUE VIEW ===== */
        <div className="dd-active">
          {/* Map — takes the most space */}
          <div className="dd-map-card">
            <MapContainer center={[activeRescue.location.lat, activeRescue.location.lng]} zoom={15} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBounds 
                driverPos={currentLocation} 
                targetPos={{ lat: activeRescue.location.lat, lng: activeRescue.location.lng }} 
              />
              {/* Driver marker */}
              {currentLocation && <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createDriverIcon()} />}
              {/* Emergency target */}
              <Marker position={[activeRescue.location.lat, activeRescue.location.lng]} icon={createTargetIcon()} />
              {/* Route line */}
              {trackingPath && (
                <Polyline 
                  positions={trackingPath} 
                  pathOptions={{ color: '#6B4226', weight: 3, dashArray: '8, 12', opacity: 0.6 }}
                />
              )}
            </MapContainer>
          </div>

          {/* Info Panel */}
          <div className="dd-info-panel">
            <div className="dd-rescue-info">
              <div className="dd-rescue-header">
                <h2 className="dd-rescue-title">{activeRescue.animalType}</h2>
                <span className="dd-rescue-status">{activeRescue.status}</span>
              </div>
              <p className="dd-rescue-desc">{activeRescue.description}</p>

              {/* ETA Display */}
              {distanceKm != null && activeRescue.status !== 'Arrived' && activeRescue.status !== 'Resolved' && (
                <div className="dd-eta-row">
                  <div className="dd-eta-value">{etaMinutes} min</div>
                  <div className="dd-eta-detail">
                    <span className="dd-eta-label">ETA to rescue</span>
                    <span className="dd-eta-dist">{distanceKm.toFixed(1)} km away</span>
                  </div>
                </div>
              )}

              {/* Status Progress */}
              <div className="dd-progress">
                {statusSteps.map((step, i) => (
                  <div key={step} className="dd-progress-step">
                    <div className={`dd-step-dot ${i <= currentStepIdx ? 'dd-step-active' : ''}`}>
                      {i <= currentStepIdx ? '✓' : i + 1}
                    </div>
                    <span className="dd-step-label">{step}</span>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="dd-contact-row">
                <a href={`tel:${activeRescue.reporterPhone || '9876543210'}`} className="dd-contact-call-btn">Call</a>
                <div>
                  <span className="dd-contact-label">Reporter Contact</span>
                  <span className="dd-contact-phone">{activeRescue.reporterPhone || "98765 43210"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="dd-actions">
              <button 
                onClick={() => updateStatus('Arrived')} 
                className={`dd-action-btn ${activeRescue.status === 'Arrived' || activeRescue.status === 'Resolved' ? 'dd-action-done' : 'dd-action-pending'}`}
                disabled={activeRescue.status === 'Arrived' || activeRescue.status === 'Resolved'}
              >
                I AM ON SITE
              </button>
              <button 
                onClick={() => updateStatus('Resolved')} 
                className="dd-action-btn dd-action-resolve"
              >
                MISSION COMPLETE
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ===== IDLE VIEW ===== */
        <div className="dd-idle">
          <div className="dd-idle-content">
            <div className="dd-idle-pulse"></div>
            <h2 className="dd-idle-title">Scanning for Assignments</h2>
            <p className="dd-idle-text">You'll be alerted when a rescue is assigned to you.</p>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

        .dd-root {
          height: 100vh;
          background: #FFF8F0;
          font-family: 'DM Sans', sans-serif;
          color: #3D2B1F;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header */
        .dd-header {
          padding: 14px 20px;
          background: white;
          border-bottom: 1.5px solid #EDE5DA;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .dd-logo {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 800;
          color: #6B4226;
          margin: 0;
        }
        .dd-logo span { font-weight: 400; color: #8C7B6B; font-family: 'DM Sans', sans-serif; font-size: 13px; margin-left: 6px; }

        .dd-connection {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 100px;
          letter-spacing: 0.5px;
        }
        .dd-connected { background: #F0F7ED; color: #4A7A3B; border: 1.5px solid #D5E8CE; }
        .dd-disconnected { background: #FFF0F0; color: #C0392B; border: 1.5px solid #F5C6C6; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

        /* Active Rescue */
        .dd-active {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .dd-map-card {
          flex: 1;
          min-height: 0;
          position: relative;
          z-index: 0;
        }

        .dd-info-panel {
          background: white;
          border-top: 1.5px solid #EDE5DA;
          padding: 16px 20px;
          flex-shrink: 0;
          display: flex;
          gap: 16px;
          align-items: stretch;
        }

        .dd-rescue-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dd-rescue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dd-rescue-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          color: #3D2B1F;
        }
        .dd-rescue-status {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 12px;
          border-radius: 100px;
          background: #FFF3E0;
          color: #D4851F;
        }
        .dd-rescue-desc {
          font-size: 13px;
          color: #8C7B6B;
          margin: 0;
          line-height: 1.4;
        }

        /* Progress */
        .dd-progress {
          display: flex;
          gap: 16px;
          margin: 4px 0;
        }

        /* ETA */
        .dd-eta-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; background: #FFF3E0; border-radius: 12px;
          border: 1.5px solid #F5DEB3;
        }
        .dd-eta-value {
          font-family: 'Playfair Display', serif; font-size: 22px;
          font-weight: 800; color: #D4851F; flex-shrink: 0;
        }
        .dd-eta-detail { display: flex; flex-direction: column; }
        .dd-eta-label {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: #8C7B6B;
        }
        .dd-eta-dist { font-size: 13px; font-weight: 600; color: #6B4226; }

        .dd-progress-step {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dd-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          background: #F6F1EB;
          color: #8C7B6B;
          border: 2px solid #EDE5DA;
          transition: all 0.3s;
        }
        .dd-step-active {
          background: #6B4226;
          color: white;
          border-color: #D2B48C;
        }
        .dd-step-label {
          font-size: 10px;
          font-weight: 600;
          color: #8C7B6B;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Contact row */
        .dd-contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #FFF8F0;
          border-radius: 12px;
          border: 1px solid #EDE5DA;
        }
        .dd-contact-call-btn {
          background: #4A7A3B;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(74,122,59,0.2);
        }
        .dd-contact-call-btn:hover {
          background: #3D6830;
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(74,122,59,0.3);
        }
        .dd-contact-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: #8C7B6B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dd-contact-phone {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #3D2B1F;
        }

        /* Actions */
        .dd-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
          width: 180px;
        }
        .dd-action-btn {
          flex: 1;
          border: none;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s;
          letter-spacing: 0.5px;
          padding: 14px 8px;
        }
        .dd-action-pending {
          background: #FFF8F0;
          color: #6B4226;
          border: 2px solid #EDE5DA;
        }
        .dd-action-pending:hover { border-color: #6B4226; background: #FAF0E6; }
        .dd-action-done {
          background: #D2B48C;
          color: white;
          opacity: 0.6;
          cursor: default;
        }
        .dd-action-resolve {
          background: #6B4226;
          color: white;
        }
        .dd-action-resolve:hover { background: #5A3720; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(107,66,38,0.15); }

        /* Idle */
        .dd-idle {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dd-idle-content {
          text-align: center;
          padding: 40px;
        }
        .dd-idle-pulse {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #EDE5DA;
          margin: 0 auto 20px;
          animation: idlePulse 2s ease-in-out infinite;
        }
        @keyframes idlePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }
        .dd-idle-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 800;
          color: #3D2B1F;
          margin: 0 0 8px;
        }
        .dd-idle-text {
          font-size: 14px;
          color: #8C7B6B;
          margin: 0;
        }

        /* Emergency Overlay */
        .dd-alert-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: linear-gradient(135deg, #C0392B 0%, #8B0000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: alertFadeIn 0.3s ease;
        }
        @keyframes alertFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dd-alert-content {
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .dd-alert-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          color: white;
          font-size: 12px;
          font-weight: 800;
          padding: 8px 24px;
          border-radius: 100px;
          letter-spacing: 3px;
          margin-bottom: 24px;
          animation: alertPulse 1s ease-in-out infinite;
        }
        @keyframes alertPulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .dd-alert-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 12px;
        }
        .dd-alert-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.8);
          font-style: italic;
          margin: 0 0 32px;
        }
        .dd-alert-accept {
          width: 100%;
          background: white;
          color: #C0392B;
          border: none;
          padding: 18px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .dd-alert-accept:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .dd-alert-accept:active { transform: scale(0.97); }

        /* Responsive — mobile friendly for drivers on phones */
        @media (max-width: 768px) {
          .dd-info-panel {
            flex-direction: column;
          }
          .dd-actions {
            width: 100%;
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
};

export default DriverDash;