import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AuthPortal() {
  const { role } = useParams(); // Gets 'volunteer', 'ngo', or 'clinic' from the URL
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggles between Login and Sign Up

  // Capitalize the role for the UI text
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Submitting ${isLogin ? 'Login' : 'Signup'} for ${displayRole}`);
    // Temporarily bypass backend to test the UI flow
    // 🚨 THE SMART REDIRECT LOGIC for all 4 roles
if (role === 'ngo') {
    navigate('/ngo'); // 🗺️ Goes to the Split-Screen Command Center
} else if (role === 'volunteer') {
    navigate('/driver'); // 🚑 Goes to the Mobile Volunteer/Driver Terminal
} else if (role === 'clinic') {
    navigate('/clinic'); // 🏥 (Note: We still need to build ClinicDash.jsx later!)
} else {
    navigate('/dashboard'); // 📸 Default for reporters reporting animals
}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {displayRole} {isLogin ? 'Login' : 'Registration'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? 'Welcome back to PawPatrol' : 'Join the PawPatrol network'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sign Up Exclusive Fields */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </>
          )}

          {/* Login Exclusive Field (Username OR Phone) */}
          {isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or Phone Number</label>
              <input type="text" required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          )}

          {/* Shared Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors mt-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle between Sign Up and Login */}
        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-500 font-medium hover:underline text-sm"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already a returning user? Log In"}
          </button>
        </div>
        
        {/* Back Button */}
        <div className="mt-4 text-center">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to Role Selection
          </button>
        </div>

      </div>
    </div>
  );
}