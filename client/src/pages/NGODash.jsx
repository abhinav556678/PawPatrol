import { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Truck, CheckCircle, MapPin, Phone, Bell } from 'lucide-react';

const NGODash = () => {
  const socket = useContext(SocketContext);
  const [reports, setReports] = useState([]); // List of incoming emergencies
  const [activeRescue, setActiveRescue] = useState(null); // The one she is currently helping

  useEffect(() => {
    if (!socket) return;

    // Listen for new reports from Abhinav or others
    socket.on('newRescueReport', (data) => {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
      setReports((prev) => [data, ...prev]);
    });

    return () => socket.off('newRescueReport');
  }, [socket]);

  const acceptRescue = (report) => {
    setActiveRescue({ ...report, status: 'Accepted' });
    updateStatus('Accepted', 'NGO is starting the rescue', report.id);
  };

  const updateStatus = async (newStatus, note, id = activeRescue?.id) => {
    const rescueId = id || activeRescue?.id;
    
    await fetch(`http://127.0.0.1:5001/api/rescues/${rescueId}/update`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}` 
      },
      body: JSON.stringify({ status: newStatus, note })
    });

    if (activeRescue) setActiveRescue({ ...activeRescue, status: newStatus });
    if (newStatus === 'Resolved') setActiveRescue(null); // Clear after completion
  };

  return (
    <div className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 italic">
        <Bell className="text-primary animate-swing" /> NGO Dispatch
      </h1>

      {activeRescue ? (
        /* 🚨 ACTIVE MISSION VIEW */
        <div className="space-y-6 border-2 border-primary p-8 rounded-3xl bg-orange-50/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{activeRescue.animalType} Rescue</h2>
              <p className="text-gray-600 mt-1">{activeRescue.description}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <button onClick={() => updateStatus('Accepted', 'En route')} className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 ${activeRescue.status === 'Accepted' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
              <Truck size={20} /> I'm Driving
            </button>
            <button onClick={() => updateStatus('Arrived', 'At location')} className={`p-4 rounded-xl font-bold flex items-center justify-center gap-2 ${activeRescue.status === 'Arrived' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
              <MapPin size={20} /> At Scene
            </button>
            <button onClick={() => updateStatus('Resolved', 'Safe')} className="p-4 rounded-xl font-bold bg-green-500 text-white mt-4 shadow-lg">
              <CheckCircle size={20} /> Animal Secured
            </button>
          </div>
        </div>
      ) : (
        /* 📜 INCOMING FEED VIEW */
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl text-gray-300">
              Scanning Kattankulathur for emergencies...
            </div>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="p-5 border-2 border-orange-100 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-lg">{r.animalType}</h3>
                  <p className="text-sm text-gray-500 truncate w-40">{r.description}</p>
                </div>
                <button onClick={() => acceptRescue(r)} className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm">
                  Accept
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NGODash;