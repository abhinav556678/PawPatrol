import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import LiveMap from '../components/Map/LiveMap';
import Timeline from '../components/Dashboard/Timeline';
import { Phone, Award } from 'lucide-react';

const Tracking = ({ rescueId, initialLocation }) => {
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [ngoData, setNgoData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('Pending');
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    if (!socket || !rescueId) return;

    // Join the unique room for this specific rescue
    socket.emit('joinRescue', rescueId);

    // Listen for live status updates from your friend (the NGO)
    socket.on('receiveStatusUpdate', (data) => {
      // data might be a string (status) or an object with { status, ngoInfo }
      if (typeof data === 'object') {
        setCurrentStatus(data.status);
        if (data.ngoInfo) setNgoData(data.ngoInfo);
      } else {
        setCurrentStatus(data);
      }

      if (data === 'Resolved') {
        setPointsEarned(50); // Match the reward system we discussed
      }
    });

    return () => socket.off('receiveStatusUpdate');
  }, [socket, rescueId]);

  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900">Rescue Status</h2>
        {pointsEarned > 0 && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold animate-bounce">
            <Award size={18} /> +{pointsEarned} Points!
          </div>
        )}
      </div>
      
      {/* Real-time Map with Draggable Pin/Search capability we added */}
      <LiveMap 
        location={initialLocation} 
        setLocation={() => {}} // In tracking mode, location is usually fixed or NGO-driven
      />

      {/* 📞 The Call NGO Button - Only shows when NGO accepts */}
      {ngoData && (
        <div className="mt-6 p-5 bg-orange-50 border-2 border-orange-100 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              {ngoData.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{ngoData.name}</p>
              <p className="text-xs text-gray-500">Contact Responder</p>
            </div>
          </div>
          <a href={`tel:${ngoData.phoneNumber}`} className="bg-primary p-3 rounded-full text-white shadow-lg hover:scale-110 transition-transform">
            <Phone size={20} fill="currentColor" />
          </a>
        </div>
      )}

      {/* Live Checkpoints */}
      <Timeline currentStatus={currentStatus} />
    </div>
  );
};

export default Tracking;