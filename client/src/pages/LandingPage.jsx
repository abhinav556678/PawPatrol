import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donationSent, setDonationSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      const sections = ['home', 'about', 'faq', 'donations', 'contact'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDonation = (e) => {
    e.preventDefault();
    setDonationSent(true);
    setTimeout(() => setDonationSent(false), 4000);
    setDonationAmount(''); setDonorName(''); setDonorEmail('');
  };

  const handleContact = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: '', email: '', message: '' });
  };

  const faqs = [
    { q: 'How does AniMap work?', a: 'AniMap uses real-time AI to prioritize animal rescues. Reporters pin the animal\'s location and describe the situation. Our AI assesses urgency, and NGOs dispatch the nearest available rescue unit.' },
    { q: 'Is AniMap free for reporters?', a: 'Yes! Reporting an animal in distress is completely free. Simply sign up and you can start reporting immediately.' },
    { q: 'How quickly will help arrive?', a: 'Response time depends on the location and availability of rescue units. Our system is designed to minimize response times by automatically dispatching the nearest ambulance.' },
    { q: 'Can I volunteer as a driver?', a: 'Yes! Sign up as a Volunteer or contact your local NGO partner. Once verified, you\'ll receive rescue assignments directly to your phone.' },
    { q: 'What happens after an animal is rescued?', a: 'The NGO will send you a follow-up report detailing how the animal was treated. You can view this in your Rescue History from the hamburger menu.' },
    { q: 'How are donations used?', a: 'Donations go directly toward rescue operations — ambulance fuel, veterinary care, medical supplies, and shelter for rescued animals.' },
  ];

  const stats = [
    { num: '12,000+', label: 'Animals Rescued' },
    { num: '150+', label: 'Rescue Partners' },
    { num: '50+', label: 'Cities Covered' },
    { num: '< 15 min', label: 'Avg. Response Time' },
  ];

  return (
    <div className="lp-root">

      {/* ===== NAVBAR ===== */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => scrollTo('home')}>
            <span className="lp-logo-icon">A</span>
            <span className="lp-logo-text">AniMap</span>
          </div>
          <div className="lp-nav-links">
            {['home', 'about', 'faq', 'donations', 'contact'].map(id => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`lp-nav-link ${activeSection === id ? 'lp-nav-active' : ''}`}
              >
                {id === 'faq' ? 'FAQ' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <button className="lp-nav-cta" onClick={() => scrollTo('home')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ===== HERO / HOME ===== */}
      <section id="home" className="lp-hero">
        <div className="lp-hero-bg-1"></div>
        <div className="lp-hero-bg-2"></div>
        <div className="lp-hero-content">
          <h1 className="lp-hero-title">
            Every life <span className="lp-accent">matters</span>.
          </h1>
          <p className="lp-hero-subtitle">
            India's first real-time AI-powered animal rescue network. Report an animal in distress — help arrives in minutes.
          </p>

          {/* Reporter CTA */}
          <button className="lp-reporter-card" onClick={() => navigate('/auth/reporter')}>
            <div className="lp-reporter-icon">!</div>
            <div className="lp-reporter-text">
              <h3>Report an Animal in Danger</h3>
              <p>Pin the location, snap a photo — our AI will assess urgency instantly.</p>
            </div>
            <span className="lp-reporter-arrow">→</span>
          </button>

          <div className="lp-divider">
            <div className="lp-divider-line"></div>
            <span className="lp-divider-text">Or join as a responder</span>
            <div className="lp-divider-line"></div>
          </div>

          <div className="lp-roles-grid">
            {[
              { id: 'volunteer', title: 'Volunteer', desc: 'Respond to rescue calls on the ground.' },
              { id: 'ngo', title: 'NGO', desc: 'Manage rescue operations at scale.' },
              { id: 'clinic', title: 'Clinic', desc: 'Provide professional veterinary care.' },
            ].map(role => (
              <button key={role.id} className="lp-role-card" onClick={() => navigate(`/auth/${role.id}`)}>
                <div className="lp-role-icon">{role.title.charAt(0)}</div>
                <h3 className="lp-role-title">{role.title}</h3>
                <p className="lp-role-desc">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <div className="lp-stats">
        {stats.map((s, i) => (
          <div key={i} className="lp-stat">
            <span className="lp-stat-num">{s.num}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ===== ABOUT ===== */}
      <section id="about" className="lp-section">
        <h2 className="lp-section-title">About <span className="lp-accent">AniMap</span></h2>
        <p className="lp-section-subtitle">Bridging the gap between animals in distress and those who can help.</p>
        <div className="lp-about-grid">
          <div className="lp-about-card">
            <div className="lp-about-icon">📍</div>
            <h3>Pin & Report</h3>
            <p>See an injured animal? Pin the location on the map, describe the situation, and snap a photo. Our AI instantly assesses urgency.</p>
          </div>
          <div className="lp-about-card">
            <div className="lp-about-icon">🤖</div>
            <h3>AI-Powered Triage</h3>
            <p>Our AI analyzes photos for injury severity, assigns priority levels, and triggers the right response — from routine pickup to emergency dispatch.</p>
          </div>
          <div className="lp-about-card">
            <div className="lp-about-icon">🚑</div>
            <h3>Real-Time Dispatch</h3>
            <p>NGO command centers see all reports live on a map. They dispatch the nearest ambulance, and you can track the rescue in real-time.</p>
          </div>
          <div className="lp-about-card">
            <div className="lp-about-icon">💚</div>
            <h3>Follow-Up Care</h3>
            <p>After rescue, the NGO sends you a follow-up report on the animal's condition. You'll know exactly how your report made a difference.</p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="lp-section lp-section-alt">
        <h2 className="lp-section-title">Frequently Asked <span className="lp-accent">Questions</span></h2>
        <div className="lp-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`lp-faq-item ${faqOpen === i ? 'lp-faq-open' : ''}`}>
              <button className="lp-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="lp-faq-arrow">{faqOpen === i ? '−' : '+'}</span>
              </button>
              {faqOpen === i && (
                <div className="lp-faq-a">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== DONATIONS ===== */}
      <section id="donations" className="lp-section">
        <h2 className="lp-section-title">Support Our <span className="lp-accent">Mission</span></h2>
        <p className="lp-section-subtitle">Your donation directly funds rescue operations, veterinary care, and animal shelters.</p>
        <div className="lp-donate-card">
          {donationSent ? (
            <div className="lp-donate-success">
              <span className="lp-donate-check">✓</span>
              <h3>Thank you for your generosity!</h3>
              <p>Your contribution will help save more lives.</p>
            </div>
          ) : (
            <form onSubmit={handleDonation} className="lp-donate-form">
              <div className="lp-donate-amounts">
                {[100, 500, 1000, 2500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className={`lp-donate-amt ${donationAmount === String(amt) ? 'lp-donate-amt-active' : ''}`}
                    onClick={() => setDonationAmount(String(amt))}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount (₹)"
                className="lp-input"
                value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                required
                min="1"
              />
              <div className="lp-donate-row">
                <input type="text" placeholder="Your Name" className="lp-input" value={donorName} onChange={e => setDonorName(e.target.value)} required />
                <input type="email" placeholder="Email" className="lp-input" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} required />
              </div>
              <button type="submit" className="lp-donate-btn">Donate ₹{donationAmount || '...'}</button>
            </form>
          )}
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="lp-section lp-section-alt">
        <h2 className="lp-section-title">Get in <span className="lp-accent">Touch</span></h2>
        <p className="lp-section-subtitle">Have questions, feedback, or want to partner with us?</p>
        <div className="lp-contact-card">
          {contactSent ? (
            <div className="lp-donate-success">
              <span className="lp-donate-check">✓</span>
              <h3>Message sent!</h3>
              <p>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="lp-contact-form">
              <div className="lp-donate-row">
                <input type="text" placeholder="Your Name" className="lp-input" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} required />
                <input type="email" placeholder="Email" className="lp-input" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} required />
              </div>
              <textarea
                placeholder="Your message..."
                className="lp-input lp-textarea"
                value={contactForm.message}
                onChange={e => setContactForm({...contactForm, message: e.target.value})}
                required
                rows={4}
              ></textarea>
              <button type="submit" className="lp-contact-btn">Send Message</button>
            </form>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-icon" style={{fontSize: '14px', width: '28px', height: '28px'}}>A</span>
            <span style={{fontFamily: "'Playfair Display', serif", fontWeight: 800, color: '#3D2B1F'}}>AniMap</span>
          </div>
          <p className="lp-footer-text">Real-time AI-powered animal rescue. Every life matters.</p>
          <div className="lp-footer-links">
            {['home','about','faq','donations','contact'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="lp-footer-link">
                {id === 'faq' ? 'FAQ' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

        .lp-root {
          font-family: 'DM Sans', sans-serif;
          background: #FFF8F0;
          color: #3D2B1F;
          min-height: 100vh;
        }
        .lp-accent { color: #6B4226; }

        /* NAV */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          padding: 12px 32px; transition: all 0.3s ease;
          background: rgba(255,248,240,0.7); backdrop-filter: blur(12px);
        }
        .lp-nav-scrolled {
          background: rgba(255,255,255,0.92); box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }
        .lp-nav-inner {
          max-width: 1200px; margin: 0 auto; display: flex;
          align-items: center; justify-content: space-between;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .lp-logo-icon {
          width: 34px; height: 34px; border-radius: 10px; background: #6B4226;
          color: white; display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-weight: 800; font-size: 16px;
        }
        .lp-logo-text {
          font-family: 'Playfair Display', serif; font-weight: 800; font-size: 20px;
          color: #3D2B1F;
        }
        .lp-nav-links { display: flex; gap: 4px; }
        .lp-nav-link {
          padding: 8px 14px; border: none; background: none;
          font-family: inherit; font-size: 13px; font-weight: 600;
          color: #8C7B6B; cursor: pointer; border-radius: 8px;
          transition: all 0.2s;
        }
        .lp-nav-link:hover { color: #6B4226; background: rgba(107,66,38,0.05); }
        .lp-nav-active { color: #6B4226; background: rgba(107,66,38,0.08); }
        .lp-nav-cta {
          padding: 9px 20px; background: #6B4226; color: white; border: none;
          border-radius: 10px; font-family: inherit; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .lp-nav-cta:hover { background: #5A3720; transform: translateY(-1px); }

        /* HERO */
        .lp-hero {
          position: relative; padding: 140px 32px 60px; text-align: center;
          overflow: hidden; min-height: 100vh; display: flex;
          align-items: center; justify-content: center;
        }
        .lp-hero-bg-1 {
          position: absolute; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(210,180,140,0.15) 0%, transparent 70%);
          top: -100px; right: -100px; border-radius: 50%;
        }
        .lp-hero-bg-2 {
          position: absolute; width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(107,66,38,0.08) 0%, transparent 70%);
          bottom: -50px; left: -50px; border-radius: 50%;
        }
        .lp-hero-content {
          position: relative; z-index: 1; max-width: 720px; width: 100%;
        }
        .lp-hero-title {
          font-family: 'Playfair Display', serif; font-size: 52px;
          font-weight: 800; line-height: 1.15; margin: 0 0 16px;
          animation: fadeUp 0.8s ease;
        }
        .lp-hero-subtitle {
          font-size: 17px; color: #8C7B6B; line-height: 1.6;
          max-width: 520px; margin: 0 auto 40px;
          animation: fadeUp 0.8s ease 0.1s backwards;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        /* Reporter CTA */
        .lp-reporter-card {
          display: flex; align-items: center; gap: 16px; width: 100%;
          padding: 20px 24px; background: white;
          border: 2px solid #EDE5DA; border-radius: 16px; cursor: pointer;
          text-align: left; transition: all 0.3s; font-family: inherit;
          animation: fadeUp 0.8s ease 0.2s backwards;
        }
        .lp-reporter-card:hover {
          border-color: #D4851F; box-shadow: 0 8px 32px rgba(212,133,31,0.1);
          transform: translateY(-2px);
        }
        .lp-reporter-icon {
          width: 44px; height: 44px; border-radius: 12px; background: #D4851F;
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; flex-shrink: 0;
        }
        .lp-reporter-text h3 { margin: 0; font-size: 16px; font-weight: 700; color: #3D2B1F; }
        .lp-reporter-text p { margin: 4px 0 0; font-size: 13px; color: #8C7B6B; }
        .lp-reporter-arrow {
          margin-left: auto; font-size: 20px; color: #D2B48C;
          transition: transform 0.2s;
        }
        .lp-reporter-card:hover .lp-reporter-arrow { transform: translateX(4px); color: #D4851F; }

        /* Divider */
        .lp-divider {
          display: flex; align-items: center; gap: 16px;
          margin: 32px 0; animation: fadeUp 0.8s ease 0.3s backwards;
        }
        .lp-divider-line { flex: 1; height: 1px; background: #EDE5DA; }
        .lp-divider-text { font-size: 12px; font-weight: 600; color: #C4B5A5; text-transform: uppercase; letter-spacing: 1px; }

        /* Roles */
        .lp-roles-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
          animation: fadeUp 0.8s ease 0.4s backwards;
        }
        .lp-role-card {
          padding: 20px 16px; background: white; border: 1.5px solid #EDE5DA;
          border-radius: 14px; cursor: pointer; text-align: center;
          font-family: inherit; transition: all 0.3s;
        }
        .lp-role-card:hover { border-color: #A67B5B; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .lp-role-icon {
          width: 40px; height: 40px; border-radius: 10px; background: #F6F1EB;
          color: #6B4226; display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-weight: 800; font-size: 18px;
          margin: 0 auto 10px;
        }
        .lp-role-title { margin: 0; font-size: 15px; font-weight: 700; color: #3D2B1F; }
        .lp-role-desc { margin: 6px 0 0; font-size: 12px; color: #8C7B6B; line-height: 1.4; }

        /* Stats */
        .lp-stats {
          display: flex; justify-content: center; gap: 0;
          background: #6B4226; padding: 0;
        }
        .lp-stat {
          flex: 1; max-width: 250px; padding: 28px 16px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .lp-stat:last-child { border-right: none; }
        .lp-stat-num {
          display: block; font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 800; color: white;
        }
        .lp-stat-label { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Sections */
        .lp-section {
          padding: 80px 32px; max-width: 900px; margin: 0 auto;
          scroll-margin-top: 80px;
        }
        .lp-section-alt { background: #FFFDFB; max-width: 100%; }
        .lp-section-alt > * { max-width: 900px; margin-left: auto; margin-right: auto; }
        .lp-section-title {
          font-family: 'Playfair Display', serif; font-size: 34px;
          font-weight: 800; text-align: center; margin: 0 0 10px;
        }
        .lp-section-subtitle {
          text-align: center; font-size: 15px; color: #8C7B6B;
          margin: 0 0 40px; line-height: 1.5;
        }

        /* About */
        .lp-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .lp-about-card {
          padding: 24px; background: white; border: 1.5px solid #EDE5DA;
          border-radius: 16px; transition: all 0.3s;
        }
        .lp-about-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .lp-about-icon { font-size: 28px; margin-bottom: 10px; }
        .lp-about-card h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
        .lp-about-card p { margin: 0; font-size: 13px; color: #8C7B6B; line-height: 1.5; }

        /* FAQ */
        .lp-faq-list { display: flex; flex-direction: column; gap: 8px; }
        .lp-faq-item {
          border: 1.5px solid #EDE5DA; border-radius: 14px; overflow: hidden;
          background: white; transition: all 0.2s;
        }
        .lp-faq-open { border-color: #A67B5B; }
        .lp-faq-q {
          width: 100%; padding: 16px 20px; border: none; background: none;
          font-family: inherit; font-size: 14px; font-weight: 600; color: #3D2B1F;
          cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; text-align: left;
        }
        .lp-faq-arrow { font-size: 20px; color: #A67B5B; font-weight: 700; flex-shrink: 0; margin-left: 16px; }
        .lp-faq-a {
          padding: 0 20px 16px; font-size: 13px; color: #8C7B6B; line-height: 1.6;
          animation: faqSlide 0.25s ease;
        }
        @keyframes faqSlide { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        /* Donations */
        .lp-donate-card {
          max-width: 520px; margin: 0 auto; padding: 32px;
          background: white; border: 1.5px solid #EDE5DA; border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
        }
        .lp-donate-form { display: flex; flex-direction: column; gap: 12px; }
        .lp-donate-amounts { display: flex; gap: 8px; }
        .lp-donate-amt {
          flex: 1; padding: 12px; border: 1.5px solid #EDE5DA; border-radius: 10px;
          background: #FFFDFB; font-family: inherit; font-size: 15px;
          font-weight: 700; color: #6B4226; cursor: pointer; transition: all 0.2s;
        }
        .lp-donate-amt:hover { border-color: #A67B5B; }
        .lp-donate-amt-active { background: #6B4226; color: white; border-color: #6B4226; }
        .lp-input {
          width: 100%; padding: 12px 14px; border: 1.5px solid #EDE5DA;
          border-radius: 10px; font-family: inherit; font-size: 14px;
          outline: none; background: #FFFDFB; color: #3D2B1F; box-sizing: border-box;
        }
        .lp-input:focus { border-color: #A67B5B; }
        .lp-textarea { resize: none; }
        .lp-donate-row { display: flex; gap: 10px; }
        .lp-donate-btn {
          padding: 14px; background: #D4851F; color: white; border: none;
          border-radius: 12px; font-family: inherit; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .lp-donate-btn:hover { background: #B87119; transform: translateY(-1px); }
        .lp-donate-success {
          text-align: center; padding: 20px;
          animation: fadeUp 0.4s ease;
        }
        .lp-donate-check {
          display: inline-flex; width: 48px; height: 48px; border-radius: 50%;
          background: #4A7A3B; color: white; font-size: 24px; font-weight: 700;
          align-items: center; justify-content: center; margin-bottom: 12px;
        }
        .lp-donate-success h3 { margin: 0 0 6px; font-size: 18px; color: #3D2B1F; }
        .lp-donate-success p { margin: 0; font-size: 14px; color: #8C7B6B; }

        /* Contact */
        .lp-contact-card {
          max-width: 520px; margin: 0 auto; padding: 32px;
          background: white; border: 1.5px solid #EDE5DA; border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
        }
        .lp-contact-form { display: flex; flex-direction: column; gap: 12px; }
        .lp-contact-btn {
          padding: 14px; background: #6B4226; color: white; border: none;
          border-radius: 12px; font-family: inherit; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .lp-contact-btn:hover { background: #5A3720; transform: translateY(-1px); }

        /* Footer */
        .lp-footer {
          background: #3D2B1F; padding: 40px 32px;
        }
        .lp-footer-inner {
          max-width: 900px; margin: 0 auto; text-align: center;
        }
        .lp-footer-brand {
          display: flex; align-items: center; gap: 8px;
          justify-content: center; margin-bottom: 10px;
        }
        .lp-footer-brand .lp-logo-icon { background: #A67B5B; }
        .lp-footer-brand span:last-child { color: white !important; }
        .lp-footer-text { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 16px; }
        .lp-footer-links { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }
        .lp-footer-link {
          padding: 6px 12px; border: none; background: none;
          font-family: inherit; font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.4); cursor: pointer; border-radius: 6px;
          transition: all 0.2s;
        }
        .lp-footer-link:hover { color: white; background: rgba(255,255,255,0.05); }

        /* Responsive */
        @media (max-width: 768px) {
          .lp-nav { padding: 10px 16px; }
          .lp-nav-links { display: none; }
          .lp-hero { padding: 100px 20px 40px; min-height: auto; }
          .lp-hero-title { font-size: 34px; }
          .lp-roles-grid { grid-template-columns: 1fr; }
          .lp-stats { flex-wrap: wrap; }
          .lp-stat { min-width: 50%; padding: 20px 12px; }
          .lp-section { padding: 48px 20px; }
          .lp-section-title { font-size: 26px; }
          .lp-about-grid { grid-template-columns: 1fr; }
          .lp-donate-card, .lp-contact-card { padding: 20px; }
          .lp-donate-row { flex-direction: column; }
          .lp-donate-amounts { flex-wrap: wrap; }
          .lp-donate-amt { min-width: calc(50% - 4px); }
        }
      `}</style>
    </div>
  );
}
