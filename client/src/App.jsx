import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelection from './pages/RoleSelection';
import AuthPortal from './pages/AuthPortal';
import ReporterDash from './pages/ReporterDash';
import NgoDash from './pages/NgoDash';
import DriverDash from './pages/DriverDash';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/:role" element={<AuthPortal />} />
        <Route path="/dashboard" element={<ReporterDash />} />
        <Route path="/ngo" element={<NgoDash />} />
        <Route path="/driver" element={<DriverDash />} />
      </Routes>
    </Router>
  );
}