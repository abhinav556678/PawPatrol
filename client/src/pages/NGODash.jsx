import React, { useState, useEffect, useContext, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SocketContext } from '../context/SocketContext.jsx'; 

// Locate Control
const LocateControl = () => {
  const map = useMap();
  const handleLocate = () => {
    map.locate().on("locationfound", (e) => {
      map.flyTo(e.latlng, 15, { animate: true, duration: 1.5 });
    });
  };
  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute bottom-5 right-5 z-[1000] bg-white p-3 rounded-full shadow-lg border-2 border-gray-200 hover:bg-gray-50 text-[#6B4226] font-bold text-sm transition-all active:scale-90"
    >
      ⊕
    </button>
  );
};

// Map controller — flies to a report when selected
const MapFlyTo = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat && target.lng) {
      // Force Leaflet to recalculate container size before flying
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
        map.flyTo([target.lat, target.lng], 17, { animate: true, duration: 1.2 });
      }, 100);
    }
  }, [target]);
  return null;
};

// Priority Bar
const PriorityBar = ({ level }) => {
  const pct = (level / 10) * 100;
  const color = level >= 8 ? '#C0392B' : level >= 5 ? '#D4851F' : '#5E8C4C';
  return (
    <div className="w-full h-1.5 bg-[#F6F1EB] rounded-full mt-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }}></div>
    </div>
  );
};

// Softer emergency pin icon
const createEmergencyIcon = (isCritical, isSelected) => {
  const size = isSelected ? 48 : 36;
  const color = isCritical ? '#C0392B' : '#D4851F';
  const glowSize = isSelected ? 60 : 0;
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `
      <div style="position:relative;width:${size}px;height:${size + 12}px;transition:all 0.3s ease;">
        ${isSelected ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);width:${glowSize}px;height:${glowSize}px;border-radius:50%;background:${color};opacity:0.15;animation:selectedPulse 1.5s ease-in-out infinite;"></div>` : ''}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="${size}" height="${size + 12}">
          <defs>
            <filter id="es${isSelected ? 's' : 'n'}${isCritical ? 'c' : 'w'}" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.3"/>
            </filter>
          </defs>
          <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}" filter="url(#es${isSelected ? 's' : 'n'}${isCritical ? 'c' : 'w'})" opacity="${isSelected ? '1' : '0.85'}"/>
          <circle cx="15" cy="13" r="5.5" fill="white" opacity="0.9"/>
          <line x1="15" y1="10" x2="15" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="13" x2="18" y2="13" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
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

// Main NGO Dashboard
const NgoDash = () => {
  const socket = useContext(SocketContext);
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]); 
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Resolved tab
  const [feedTab, setFeedTab] = useState('live'); // 'live' | 'resolved'
  const [resolvedCases, setResolvedCases] = useState([]);
  const [followUpTexts, setFollowUpTexts] = useState({}); // { reportId: text }
  const [submittingFollowUp, setSubmittingFollowUp] = useState(null);

  const fetchResolved = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/reports/history');
      if (res.ok) { const data = await res.json(); setResolvedCases(data); }
    } catch (err) { console.error('Resolved fetch error:', err); }
  };

  const submitFollowUp = async (reportId) => {
    const text = followUpTexts[reportId];
    if (!text?.trim()) return;
    setSubmittingFollowUp(reportId);
    try {
      const res = await fetch(`http://localhost:5001/api/reports/${reportId}/followup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpReport: text.trim() })
      });
      if (res.ok) {
        // Emit socket event for reporter notification
        if (socket) {
          socket.emit('caseFollowUp', { reportId, followUpReport: text.trim() });
        }
        setFollowUpTexts(prev => ({ ...prev, [reportId]: '' }));
        fetchResolved(); // refresh list
      }
    } catch (err) { console.error('Follow-up submit error:', err); }
    finally { setSubmittingFollowUp(null); }
  };

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
            _id: gpsData.driverId, name: "Active Ambulance (Live)",
            currentLocation: { lat: gpsData.lat, lng: gpsData.lng }, phone: "Live Tracking"
          }];
        }
      });
    });
    return () => { socket.off('updateMap'); };
  }, [socket]);

  // Click a report in the feed → fly to it on the map
  const handleReportClick = (report) => {
    if (!report.location?.lat) return;
    setSelectedReport(report._id);
    setFlyTarget({ lat: report.location.lat, lng: report.location.lng, ts: Date.now() });
  };

  return (
    <div className="ngo-root">

      {/* Header */}
      <header className="ngo-header">
        <div>
          <h1 className="ngo-title">Command Center</h1>
          <p className="ngo-subtitle">Real-time Triage & Deployment</p>
        </div>
        <div className="ngo-header-actions">
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`ngo-heatmap-btn ${showHeatmap ? 'ngo-heatmap-active' : ''}`}
          >
            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          </button>
          <div className="ngo-ambulance-count">
            {drivers.length} Ambulances
          </div>
          <div className="ngo-report-count">
            {reports.length} Active
          </div>
        </div>
      </header>

      {/* Main Grid: Map + Feed */}
      <div className="ngo-grid">
        
        {/* MAP */}
        <div className="ngo-map-card">
          <div className="ngo-map-wrap">
            <MapContainer center={[12.8230, 80.0450]} zoom={15} className="h-full w-full z-0">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocateControl />
              <MapFlyTo target={flyTarget} />
              {drivers.map((driver) => (
                <Marker 
                  key={`driver-${driver._id}`} 
                  position={[driver.currentLocation?.lat || 12.823, driver.currentLocation?.lng || 80.045]}
                  icon={createAmbulanceIcon()}
                >
                  <Popup><div className="font-bold">{driver.name}</div><div className="text-sm text-gray-600">{driver.phone}</div></Popup>
                </Marker>
              ))}
              {reports.map((report) => {
                if (!report.location || !report.location.lat) return null;
                const isSelected = selectedReport === report._id;
                return (
                  <Marker 
                    key={`report-${report._id}`} 
                    position={[report.location.lat, report.location.lng]}
                    icon={createEmergencyIcon(report.priority >= 8, isSelected)}
                    zIndexOffset={isSelected ? 1000 : 0}
                  >
                    <Popup>
                      <div className="font-bold">{report.animalType}</div>
                      <p className="text-xs text-gray-600 mt-1">{report.aiSummary}</p>
                    </Popup>
                  </Marker>
                );
              })}
              {showHeatmap && reports.map((r) => (
                r.location?.lat && <Circle key={`heat-${r._id}`} center={[r.location.lat, r.location.lng]} radius={250} pathOptions={{ fillColor: '#C0392B', fillOpacity: 0.12, stroke: false }} />
              ))}
            </MapContainer>
          </div>
        </div>

        {/* TRIAGE FEED */}
        <div className="ngo-feed-card">
          {/* Tab Buttons */}
          <div className="ngo-feed-tabs">
            <button 
              className={`ngo-tab-btn ${feedTab === 'live' ? 'ngo-tab-active' : ''}`} 
              onClick={() => setFeedTab('live')}
            >
              Live Triage ({reports.length})
            </button>
            <button 
              className={`ngo-tab-btn ${feedTab === 'resolved' ? 'ngo-tab-active' : ''}`} 
              onClick={() => { setFeedTab('resolved'); fetchResolved(); }}
            >
              Resolved Cases
            </button>
          </div>

          <div className="ngo-feed-scroll">
            {feedTab === 'live' ? (
              /* ===== LIVE FEED ===== */
              <>
            {reports.map((report, idx) => (
              <div 
                key={report._id} 
                className={`ngo-report-card ${report.priority >= 8 ? 'ngo-report-critical' : ''} ${selectedReport === report._id ? 'ngo-report-selected' : ''}`}
                onClick={() => handleReportClick(report)}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="ngo-report-header">
                  <h3 className={`ngo-report-name ${report.priority >= 8 ? 'ngo-report-name-critical' : ''}`}>
                    {report.animalType}
                  </h3>
                  <span className="ngo-report-priority">P-{report.priority}</span>
                </div>
                <PriorityBar level={report.priority} />
                <p className="ngo-report-desc">{report.description}</p>
                
                {report.photoUrl && (
                  <img 
                    src={`http://localhost:5001${report.photoUrl}`} 
                    alt="Incident" 
                    className="ngo-report-img ngo-clickable-img" 
                    onClick={(e) => { e.stopPropagation(); setLightboxPhoto(`http://localhost:5001${report.photoUrl}`); }}
                  />
                )}

                <div className="ngo-ai-summary">
                  AI: {report.aiSummary}
                </div>

                <div className="ngo-dispatch-row" onClick={(e) => e.stopPropagation()}>
                  <select id={`driver-select-${report._id}`} className="ngo-driver-select">
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
                      if (selectedReport === report._id) setSelectedReport(null);
                    }}
                    className="ngo-dispatch-btn"
                  >
                    Dispatch
                  </button>
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="ngo-empty">No active emergencies.</div>
            )}
              </>
            ) : (
              /* ===== RESOLVED CASES ===== */
              <>
                {resolvedCases.map((r, idx) => (
                  <div key={r._id} className="ngo-report-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="ngo-report-header">
                      <h3 className="ngo-report-name">{r.animalType}</h3>
                      <span className="ngo-resolved-badge">Resolved</span>
                    </div>
                    <p className="ngo-report-desc">{r.description}</p>
                    <span className="ngo-resolved-date">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {r.followUpReport ? (
                      <div className="ngo-followup-existing">
                        <span className="ngo-followup-label">Follow-Up Sent ✓</span>
                        <p className="ngo-followup-text">{r.followUpReport}</p>
                      </div>
                    ) : (
                      <div className="ngo-followup-form">
                        <textarea
                          className="ngo-followup-input"
                          placeholder="Write a follow-up report for the reporter... (e.g., 'Animal was safely rescued and taken to XYZ veterinary clinic. Currently stable and receiving treatment.')"
                          value={followUpTexts[r._id] || ''}
                          onChange={e => setFollowUpTexts(prev => ({ ...prev, [r._id]: e.target.value }))}
                          rows={3}
                        />
                        <button
                          className="ngo-followup-submit"
                          onClick={() => submitFollowUp(r._id)}
                          disabled={submittingFollowUp === r._id || !followUpTexts[r._id]?.trim()}
                        >
                          {submittingFollowUp === r._id ? 'Sending...' : 'Send Report to Reporter'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {resolvedCases.length === 0 && (
                  <div className="ngo-empty">No resolved cases yet.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div className="ngo-lightbox" onClick={() => setLightboxPhoto(null)}>
          <button className="ngo-lightbox-close" onClick={() => setLightboxPhoto(null)}>×</button>
          <img src={lightboxPhoto} alt="Full view" className="ngo-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

        @keyframes selectedPulse {
          0%, 100% { transform: translate(-50%,-60%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%,-60%) scale(1.4); opacity: 0.08; }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ngo-root {
          height: 100vh;
          background: #FFF8F0;
          font-family: 'DM Sans', sans-serif;
          color: #3D2B1F;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        /* Header */
        .ngo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 18px 24px;
          border-radius: 18px;
          border: 1.5px solid #EDE5DA;
        }
        .ngo-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 800;
          color: #3D2B1F;
          margin: 0;
        }
        .ngo-subtitle {
          font-size: 12px;
          color: #8C7B6B;
          font-weight: 500;
          margin: 2px 0 0;
        }
        .ngo-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ngo-heatmap-btn {
          padding: 9px 18px;
          border-radius: 10px;
          border: 1.5px solid #EDE5DA;
          background: white;
          font-size: 12px;
          font-weight: 600;
          color: #6B4226;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s;
        }
        .ngo-heatmap-btn:hover { border-color: #A67B5B; background: #FFF8F0; }
        .ngo-heatmap-active { background: #6B4226; color: white; border-color: #6B4226; }
        .ngo-heatmap-active:hover { background: #5A3720; }
        .ngo-ambulance-count {
          padding: 9px 16px;
          border-radius: 10px;
          background: #F0F7ED;
          color: #4A7A3B;
          font-size: 12px;
          font-weight: 700;
          border: 1.5px solid #D5E8CE;
        }
        .ngo-report-count {
          padding: 9px 16px;
          border-radius: 10px;
          background: #FFF3E0;
          color: #D4851F;
          font-size: 12px;
          font-weight: 700;
          border: 1.5px solid #F5DEB3;
        }

        /* Grid — FULL WIDTH */
        .ngo-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 12px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* Map Card */
        .ngo-map-card {
          background: white;
          border-radius: 18px;
          border: 1.5px solid #EDE5DA;
          padding: 10px;
          overflow: hidden;
          min-height: 0;
        }
        .ngo-map-wrap {
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          z-index: 0;
        }

        /* Feed Card */
        .ngo-feed-card {
          background: white;
          border-radius: 18px;
          border: 1.5px solid #EDE5DA;
          padding: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }
        .ngo-feed-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 800;
          color: #3D2B1F;
          margin: 0 0 12px;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #EDE5DA;
          flex-shrink: 0;
        }
        .ngo-feed-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-right: 4px;
        }

        /* Report Card */
        .ngo-report-card {
          padding: 16px;
          border: 1.5px solid #EDE5DA;
          border-radius: 14px;
          background: #FFFDFB;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          animation: cardFadeIn 0.4s ease backwards;
        }
        .ngo-report-card:hover { border-color: #D2B48C; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(107,66,38,0.06); }
        .ngo-report-selected {
          border-color: #6B4226 !important;
          box-shadow: 0 0 0 3px rgba(107,66,38,0.08), 0 6px 20px rgba(107,66,38,0.08) !important;
          background: #FFF8F0;
        }
        .ngo-report-critical {
          border-color: #E8AFA0;
          background: #FFF9F7;
        }
        .ngo-report-critical:hover { border-color: #C0392B; }

        .ngo-report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .ngo-report-name {
          font-size: 15px;
          font-weight: 700;
          color: #3D2B1F;
          margin: 0;
        }
        .ngo-report-name-critical { color: #A93226; }
        .ngo-report-priority {
          font-size: 10px;
          font-weight: 700;
          color: #8C7B6B;
          background: #F6F1EB;
          padding: 3px 10px;
          border-radius: 8px;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .ngo-report-desc {
          font-size: 12px;
          color: #8C7B6B;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ngo-report-img {
          width: 100%;
          height: 90px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #EDE5DA;
        }

        .ngo-ai-summary {
          font-size: 10px;
          font-family: monospace;
          color: #6B4226;
          background: #FFF8F0;
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid #EDE5DA;
          line-height: 1.5;
        }

        /* Dispatch Row */
        .ngo-dispatch-row {
          display: flex;
          gap: 6px;
        }
        .ngo-driver-select {
          flex: 1;
          padding: 8px 10px;
          border: 1.5px solid #EDE5DA;
          border-radius: 8px;
          font-size: 11px;
          font-family: inherit;
          outline: none;
          background: #FFFDFB;
          color: #3D2B1F;
        }
        .ngo-driver-select:focus { border-color: #A67B5B; }
        .ngo-dispatch-btn {
          padding: 8px 16px;
          background: #6B4226;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ngo-dispatch-btn:hover { background: #5A3720; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(107,66,38,0.15); }

        /* Feed Tabs */
        .ngo-feed-tabs {
          display: flex; gap: 0; padding: 0; margin-bottom: 12px;
          border-bottom: 1.5px solid #EDE5DA; flex-shrink: 0;
        }
        .ngo-tab-btn {
          flex: 1; padding: 10px 8px; border: none; background: none;
          font-family: inherit; font-size: 12px; font-weight: 700;
          color: #8C7B6B; cursor: pointer; transition: all 0.2s;
          border-bottom: 2.5px solid transparent; text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .ngo-tab-btn:hover { color: #6B4226; }
        .ngo-tab-active { color: #6B4226; border-bottom-color: #6B4226; }

        /* Resolved badge & date */
        .ngo-resolved-badge {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          padding: 3px 10px; border-radius: 100px; background: #F0F7ED;
          color: #4A7A3B; letter-spacing: 0.5px;
        }
        .ngo-resolved-date {
          font-size: 10px; color: #D2B48C; font-weight: 600;
        }

        /* Follow-up form */
        .ngo-followup-form { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
        .ngo-followup-input {
          width: 100%; padding: 8px 10px; border: 1.5px solid #EDE5DA;
          border-radius: 10px; font-size: 11px; font-family: inherit;
          outline: none; resize: none; background: #FFFDFB; color: #3D2B1F;
          line-height: 1.5;
        }
        .ngo-followup-input:focus { border-color: #A67B5B; }
        .ngo-followup-input::placeholder { color: #C4B5A5; }
        .ngo-followup-submit {
          align-self: flex-end; padding: 7px 16px;
          background: #4A7A3B; color: white; border: none;
          border-radius: 8px; font-size: 11px; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: all 0.2s;
        }
        .ngo-followup-submit:hover { background: #3D6830; transform: translateY(-1px); }
        .ngo-followup-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Sent follow-up */
        .ngo-followup-existing {
          margin-top: 4px; padding: 8px 10px; background: #F0F7ED;
          border: 1px solid #D5E8CF; border-radius: 10px;
        }
        .ngo-followup-label {
          display: block; font-size: 9px; font-weight: 700; color: #4A7A3B;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .ngo-followup-text {
          font-size: 12px; color: #3D2B1F; line-height: 1.5; margin: 0;
        }

        /* Empty */
        .ngo-empty {
          text-align: center;
          padding: 48px 16px;
          color: #D2B48C;
          font-weight: 600;
          font-size: 14px;
          background: #FFFDFB;
          border: 2px dashed #EDE5DA;
          border-radius: 14px;
        }

        /* Clickable images */
        .ngo-clickable-img { cursor: zoom-in; transition: opacity 0.2s; }
        .ngo-clickable-img:hover { opacity: 0.85; }

        /* Lightbox */
        .ngo-lightbox {
          position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center; cursor: zoom-out;
          animation: lbFadeIn 0.25s ease;
        }
        @keyframes lbFadeIn { from { opacity:0; } to { opacity:1; } }
        .ngo-lightbox-img {
          max-width: 90vw; max-height: 85vh; border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4); cursor: default;
          animation: lbZoomIn 0.3s ease;
        }
        @keyframes lbZoomIn { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
        .ngo-lightbox-close {
          position: absolute; top: 20px; right: 24px; width: 40px; height: 40px;
          border-radius: 50%; border: none; background: rgba(255,255,255,0.15);
          color: white; font-size: 24px; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: background 0.2s;
        }
        .ngo-lightbox-close:hover { background: rgba(255,255,255,0.3); }

        /* Scrollbar */
        .ngo-feed-scroll::-webkit-scrollbar { width: 3px; }
        .ngo-feed-scroll::-webkit-scrollbar-track { background: transparent; }
        .ngo-feed-scroll::-webkit-scrollbar-thumb { background: #D2B48C; border-radius: 4px; }

        /* Responsive */
        @media (max-width: 1024px) {
          .ngo-grid { grid-template-columns: 1fr; }
          .ngo-map-wrap { min-height: 400px; }
        }
        @media (max-width: 640px) {
          .ngo-root { padding: 12px; }
          .ngo-header { flex-direction: column; gap: 12px; align-items: flex-start; }
          .ngo-header-actions { width: 100%; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default NgoDash;