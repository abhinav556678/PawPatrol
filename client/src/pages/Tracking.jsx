import { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import LiveMap from '../components/Map/LiveMap';
import Timeline from '../components/Dashboard/Timeline';
import { Phone, Award, Send, MessageSquare, ShieldCheck } from 'lucide-react';

const Tracking = ({ rescueId, initialLocation }) => {
  const socket = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [ngoData, setNgoData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('Pending');
  const [pointsEarned, setPointsEarned] = useState(0);

  // ✨ NEW: AI Chat States
  const [messages, setMessages] = useState([
    { role: 'bot', text: "I'm your AI Rescue Assistant. While you wait, I can provide first-aid guidance. What is the animal's condition? 🐾" }
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!socket || !rescueId) return;

    // Join the unique room for this specific rescue
    socket.emit('joinRescue', rescueId);

    // Listen for live status updates
    socket.on('receiveStatusUpdate', (data) => {
      if (typeof data === 'object') {
        setCurrentStatus(data.status);
        if (data.ngoInfo) setNgoData(data.ngoInfo);
      } else {
        setCurrentStatus(data);
      }

      if (data === 'Resolved') {
        setPointsEarned(50); // Reward system for Foundathon
      }
    });

    // ✨ NEW: Listen for AI First-Aid Responses
    socket.on('aiChatResponse', (data) => {
      setMessages(prev => [...prev, { role: 'bot', text: data.text }]);
    });

    return () => {
      socket.off('receiveStatusUpdate');
      socket.off('aiChatResponse');
    };
  }, [socket, rescueId]);

  // ✨ NEW: Handle Sending Messages to AI
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);

    // Emit to backend for filtered AI processing
    socket.emit('reporterChatMessage', { 
      text: inputValue, 
      rescueId: rescueId 
    });

    setInputValue('');
  };

  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Rescue Tracking</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Case ID: {rescueId || 'Pending...'}</p>
        </div>
        {pointsEarned > 0 && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold animate-bounce shadow-sm border border-green-200">
            <Award size={18} /> +{pointsEarned} Points!
          </div>
        )}
      </div>
      
      {/* Live Map with status-based UI feedback */}
      <div className="relative group">
        <LiveMap 
          location={initialLocation} 
          setLocation={() => {}} 
        />
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentStatus === 'Dispatched' ? 'bg-blue-500 animate-ping' : 'bg-orange-500'}`}></div>
          <span className="text-[10px] font-black uppercase text-gray-700">{currentStatus}</span>
        </div>
      </div>

      {/* 📞 NGO Contact Card */}
      {ngoData && (
        <div className="p-5 bg-orange-50 border-2 border-orange-100 rounded-[2rem] flex items-center justify-between shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-black shadow-lg">
              {ngoData.name[0]}
            </div>
            <div>
              <p className="font-black text-gray-900">{ngoData.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                <ShieldCheck size={12} /> Verified NGO Partner
              </div>
            </div>
          </div>
          <a href={`tel:${ngoData.phoneNumber}`} className="bg-orange-500 p-4 rounded-2xl text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
            <Phone size={20} fill="currentColor" />
          </a>
        </div>
      )}

      {/* Live Checkpoints */}
      <Timeline currentStatus={currentStatus} />

      {/* ✨ NEW: AI FIRST-AID ASSISTANT */}
      <div className="border-2 border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
        <div className="bg-gray-900 text-white p-5 font-black text-xs uppercase tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-orange-400" />
            AI First-Aid Support
          </div>
          <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px]">Online</span>
          </div>
        </div>
        
        <div className="h-64 overflow-y-auto p-6 space-y-4 bg-gray-50/50 shadow-inner">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium shadow-sm border ${
                m.role === 'bot' 
                  ? 'bg-white text-gray-800 border-gray-100 rounded-tl-none' 
                  : 'bg-orange-500 text-white border-orange-400 rounded-tr-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask for help (e.g., 'the animal is bleeding')"
            className="flex-1 bg-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200 transition-all placeholder:text-gray-400"
          />
          <button 
            onClick={handleSendMessage} 
            className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tracking;