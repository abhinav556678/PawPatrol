import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import AuthPortal from './pages/AuthPortal';
import ReporterDash from './pages/ReporterDash';

// 🚨 FIXED IMPORTS:
import NgoDash from './pages/NgoDash'; 
import DriverDash from './pages/DriverDash';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Step 1: Pick a role */}
        <Route path="/" element={<RoleSelection />} />
        
        {/* Step 2: Login/Signup for that specific role */}
        <Route path="/auth/:role" element={<AuthPortal />} />
        
        {/* Step 3: The actual app */}
        <Route path="/dashboard" element={<ReporterDash />} />

        {/* 🚨 ADDED THE NGO ROUTE */}
        <Route path="/ngo" element={<NgoDash />} />

        {/* The Driver App */}
        <Route path="/driver" element={<DriverDash />} />
      </Routes>
    </Router>
  );
}