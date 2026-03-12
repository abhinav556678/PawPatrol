import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

export default function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    { 
      id: 'volunteer', 
      title: 'Volunteer', 
      desc: 'Respond to rescue calls on the ground. Provide first-aid and temporary shelter.',
      iconClass: 'rs-role-icon-volunteer'
    },
    { 
      id: 'ngo', 
      title: 'NGO', 
      desc: 'Manage rescue operations, coordinate dispatch fleets at scale.',
      iconClass: 'rs-role-icon-ngo'
    },
    { 
      id: 'clinic', 
      title: 'Clinic', 
      desc: 'Provide professional veterinary care for rescued animals.',
      iconClass: 'rs-role-icon-clinic'
    }
  ];

  return (
    <div className="rs-root">
      <div className="rs-bg-shape-1"></div>
      <div className="rs-bg-shape-2"></div>

      <div className="rs-container">

        <header className="rs-header">
          <div className="rs-logo-wrap">
            <div className="rs-logo-paw">A</div>
            <span className="rs-logo-text">AniMap</span>
          </div>
        </header>

        <div className="rs-hero">
          <h1 className="rs-title">
            How can we <span className="rs-accent">help</span> today?
          </h1>
          <p className="rs-subtitle">
            Report an animal in distress or join our rescue network as a responder.
          </p>
        </div>

        <button 
          className="rs-reporter-card"
          onClick={() => navigate('/auth/reporter')}
        >
          <div className="rs-reporter-icon">!</div>
          <div className="rs-reporter-text">
            <h3>Report an Animal in Danger</h3>
            <p>Pin the location, snap a photo — our AI will assess urgency instantly.</p>
          </div>
          <span className="rs-reporter-arrow">→</span>
        </button>

        <div className="rs-divider">
          <div className="rs-divider-line"></div>
          <span className="rs-divider-text">Or join as a responder</span>
          <div className="rs-divider-line"></div>
        </div>

        <div className="rs-grid">
          {roles.map((role) => (
            <button 
              key={role.id}
              className="rs-role-card"
              onClick={() => navigate(`/auth/${role.id}`)}
            >
              <div className={`rs-role-icon ${role.iconClass}`}>
                {role.title.charAt(0)}
              </div>
              <h3 className="rs-role-title">{role.title}</h3>
              <p className="rs-role-desc">{role.desc}</p>
              <span className="rs-role-btn">Select</span>
            </button>
          ))}
        </div>

        <div className="rs-info-bar">
          Over 12,000 animals rescued through our network.
        </div>

      </div>
    </div>
  );
}