import { Link } from 'react-router-dom';
import { PawPrint, AlertTriangle } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      
      {/* Main Content Container */}
      <div className="text-center max-w-2xl transform transition-all hover:scale-105 duration-500">
        
        {/* Minimal Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 rounded-full text-primary">
            <PawPrint size={48} strokeWidth={2.5} />
          </div>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Rapid <span className="text-primary">Animal Rescue</span>
        </h1>
        
        <p className="text-lg text-gray-500 mb-10 leading-relaxed">
          A minimalist dispatch system. Report distressed animals instantly with precise GPS coordinates, connecting them with nearby NGOs in real-time.
        </p>

        {/* Interactive Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <Link 
            to="/report" 
            className="flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <AlertTriangle size={20} />
            Report Emergency
          </Link>
          
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-primary border-2 border-primary font-semibold py-3 px-8 rounded-full shadow-sm hover:shadow transition-all duration-300"
          >
            NGO Login
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default Home;