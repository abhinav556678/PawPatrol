import { useNavigate } from 'react-router-dom';
import { AlertCircle, Heart, Building2, Stethoscope } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  // The professional roles
  const networkRoles = [
    { id: 'volunteer', title: 'Volunteer', icon: Heart, desc: 'Respond to reports on the ground.' },
    { id: 'ngo', title: 'NGO', icon: Building2, desc: 'Manage rescue fleets and operations.' },
    { id: 'clinic', title: 'Clinic', icon: Stethoscope, desc: 'Provide medical care for rescues.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">🐾 PawPatrol</h1>
        <p className="text-gray-600 text-lg">Welcome. How can we help today?</p>
      </div>

      <div className="max-w-4xl w-full space-y-8">
        
        {/* 🚨 THE GIANT REPORTER BUTTON */}
        <button
          onClick={() => navigate('/auth/reporter')}
          className="w-full bg-orange-500 p-8 rounded-2xl shadow-md hover:bg-orange-600 transition-all hover:-translate-y-1 text-left flex items-center gap-6 group"
        >
          <div className="h-20 w-20 bg-white text-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={40} />
          </div>
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-2">I am a Reporter</h2>
            <p className="text-orange-100 text-lg">I found an animal in danger and need to request an emergency rescue.</p>
          </div>
        </button>

        {/* Visual Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-400 font-medium text-sm tracking-wider">OR JOIN THE NETWORK</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* 🏢 THE NETWORK ROLES (Volunteer, NGO, Clinic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {networkRoles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => navigate(`/auth/${role.id}`)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-500 hover:shadow-md transition-all group text-left flex flex-col items-center text-center"
              >
                <div className="h-14 w-14 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Icon size={28} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{role.title}</h2>
                <p className="text-gray-500 text-sm">{role.desc}</p>
              </button>
            );
          })}
        </div>
        
      </div>
    </div>
  );
}