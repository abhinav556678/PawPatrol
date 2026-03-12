import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AuthPortal.css';

export default function AuthPortal() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate a brief loading animation
    await new Promise(resolve => setTimeout(resolve, 800));

    if (role === 'ngo') {
      navigate('/ngo');
    } else if (role === 'volunteer') {
      navigate('/driver');
    } else if (role === 'clinic') {
      navigate('/clinic');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-shape-1"></div>
      <div className="auth-shape-2"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">A</div>
          <h2 className="auth-title">
            {displayRole} {isLogin ? 'Login' : 'Registration'}
          </h2>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back to AniMap' : 'Join the AniMap network'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="auth-field">
                <label>Full Name</label>
                <input type="text" required placeholder="Your full name" />
              </div>
              <div className="auth-field">
                <label>Username</label>
                <input type="text" required placeholder="Choose a username" />
              </div>
              <div className="auth-field">
                <label>Phone Number</label>
                <input type="tel" required placeholder="Your phone number" />
              </div>
            </>
          )}

          {isLogin && (
            <div className="auth-field">
              <label>Username or Phone Number</label>
              <input type="text" required placeholder="Enter your credentials" />
            </div>
          )}

          <div className="auth-field">
            <label>Password</label>
            <input type="password" required placeholder="Enter password" />
          </div>

          <button type="submit" className={`auth-submit ${isSubmitting ? 'auth-submit-loading' : ''}`} disabled={isSubmitting}>
            <span className="auth-submit-text">
              {isSubmitting ? '' : (isLogin ? 'Sign In' : 'Create Account')}
            </span>
            {isSubmitting && <span className="auth-spinner"></span>}
          </button>
        </form>

        <div className="auth-toggle">
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign Up" : "Already a returning user? Log In"}
          </button>
        </div>
        
        <div className="auth-back">
          <button onClick={() => navigate('/')}>← Back to Role Selection</button>
        </div>
      </div>
    </div>
  );
}