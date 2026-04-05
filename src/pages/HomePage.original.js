import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../assets/delivery.png';
import Logo from '../assets/logo.png';

// Public folder images with spaces must be URL-encoded
const IMAGES = {
  cargo: '/homepagepics/cargoguy.jpg',
  handyman: '/homepagepics/handyman.jpg',
  banking: '/homepagepics/bankingpics.webp',
  delivery: '/homepagepics/deliveryguy.jpg',
};

const HomePage = () => {
  return (
    <div className="COLOR">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo-container">
            <div className="logo">
              <img src={Logo} alt="Fagi Errands Logo" />
            </div>
            <h1>Fagi Errands</h1>
          </div>
          <div className="nav-links">
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/contact" className="contact-button">Contact Us</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="main-container">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-title">
              Errands, Deliveries, and Skilled Help—On Demand
            </h1>
            <p className="hero-subtitle">
              From cargo pick-up to handyman tasks and banking assistance, we help you get more done—fast, safe, and hassle‑free.
            </p>
            <div className="cta-container">
              <Link to="/get-started" className="get-started-button">Get Started</Link>
            </div>

            {/* Hero visual collage to preview services */}
            <div className="hero-gallery" aria-hidden="true">
              <img src={IMAGES.delivery} alt="" loading="lazy" />
              <img src={IMAGES.cargo} alt="" loading="lazy" />
              <img src={IMAGES.handyman} alt="" loading="lazy" />
              <img src={IMAGES.banking} alt="" loading="lazy" />
            </div>
          </div>

          {/* Feature highlight section */}
          <div className="feature-section">
            <div className="feature-content">
              <div className="feature-text">
                <h2>One App. Many Services. Zero Stress.</h2>
                <p>
                  Manage your day with a few taps. Create a task, track progress in real‑time, and pay securely. We match you with trusted assistants to deliver reliably, every time.
                </p>
                <Link to="/features" className="start-button">See Features</Link>
              </div>
              <div className="feature-image">
                {/* Fallback hero image (kept for bundle splitting) */}
                <img src={Hero} alt="Efficient deliveries and errands" loading="lazy" />
              </div>
            </div>
          </div>

          {/* What We Do - Alternating Image/Text */}
          <section className="services-section" aria-labelledby="services-heading">
            <h2 id="services-heading" className="section-title">What We Do</h2>
            <div className="alt-section">
              <div className="alt-row">
                <div className="alt-image">
                  <img src={IMAGES.cargo} alt="Cargo and courier delivery" loading="lazy" />
                </div>
                <div className="alt-text">
                  <h3>Cargo & Courier, Delivered Right</h3>
                  <p>Insured delivery with live tracking, careful handling, and same‑day options—so your items arrive safe and on time.</p>
                  <Link to="/login" className="alt-cta">Send a Package Now</Link>
                </div>
              </div>

              <div className="alt-row reverse">
                <div className="alt-image">
                  <img src={IMAGES.handyman} alt="Professional handyman services" loading="lazy" />
                </div>
                <div className="alt-text">
                  <h3>Handyman Help, When You Need It</h3>
                  <p>From quick fixes to full installations—vetted pros show up on time, with the right tools, and get it done right.</p>
                  <Link to="/login" className="alt-cta">Book a Pro</Link>
                </div>
              </div>

              <div className="alt-row">
                <div className="alt-image">
                  <img src={IMAGES.delivery} alt="Pickup and delivery around the city" loading="lazy" />
                </div>
                <div className="alt-text">
                  <h3>Pickup & Delivery, Done For You</h3>
                  <p>Skip the trip—get groceries, documents, and essentials picked up and delivered fast, exactly when you need them.</p>
                  <Link to="/login" className="alt-cta">Schedule a Delivery</Link>
                </div>
              </div>

              <div className="alt-row reverse">
                <div className="alt-image">
                  <img src={IMAGES.banking} alt="Banking and payments assistance" loading="lazy" />
                </div>
                <div className="alt-text">
                  <h3>Banking Made Easy</h3>
                  <p>Beat the queue—trusted help for deposits, withdrawals, and payments with verified assistants and secure handling.</p>
                  <Link to="/login" className="alt-cta">Get Banking Help</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <div className="benefits-section">
            <div className="benefit-item">
              <h3>Fast Task Completion</h3>
              <p>Get errands done quickly and reliably</p>
            </div>
            <div className="benefit-item">
              <h3>Trusted Service</h3>
              <p>Reliable help you can depend on</p>
            </div>
            <div className="benefit-item">
              <h3>24/7 Support</h3>
              <p>We're here whenever you need us</p>
            </div>
          </div>

          <hr className="divider" />

          {/* Footer */}
          <footer className="footer">
            <div className="footer-grid">
              <div className="footer-col brand">
                <div className="brand-top">
                  <div className="brand-logo"><img src={Logo} alt="Fagi Errands" /></div>
                  <div className="brand-name">Fagi Errands</div>
                </div>
                <p className="brand-text">Errands, deliveries, and skilled help on demand. Fast. Reliable. Secure.</p>
              </div>

              <div className="footer-col">
                <h4 className="footer-title">Quick Links</h4>
                <nav className="footer-list">
                  <Link to="/" className="footer-link">Home</Link>
                  <Link to="/features" className="footer-link">Features</Link>
                  <Link to="/get-started" className="footer-link">Get Started</Link>
                  <Link to="/about" className="footer-link">About Us</Link>
                  <Link to="/contact" className="footer-link">Contact</Link>
                </nav>
              </div>

              <div className="footer-col">
                <h4 className="footer-title">Services</h4>
                <nav className="footer-list">
                  <Link to="/login" className="footer-link">Cargo & Courier</Link>
                  <Link to="/login" className="footer-link">Handyman Services</Link>
                  <Link to="/login" className="footer-link">Pickup & Delivery</Link>
                  <Link to="/login" className="footer-link">Banking Assistance</Link>
                </nav>
              </div>

              <div className="footer-col">
                <h4 className="footer-title">Support</h4>
                <div className="footer-list">
                  <div className="footer-text">Phone: 0207165601</div>
                  <div className="footer-text">Support: 24/7</div>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <div className="copyright">© 2025 Fagi Errands. All rights reserved.</div>
            </div>
          </footer>
        </div>
      </main>

      {/* Styles */}
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .COLOR {
          background: #49AFAF;
          background: radial-gradient(at center, #49AFAF, #A8DFF4);
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .logo-container {
          display: flex;
          align-items: center;
        }

        .logo { width: 40px; height: 40px; margin-right: 10px; }
        .logo img { width: 100%; height: 100%; }

        h1 { font-size: 24px; font-weight: 800; color: #111827; font-family: var(--font-heading); letter-spacing: -0.02em; }

        .nav-links { display: flex; align-items: center; gap: 24px; }
        .nav-link { color: #111827; text-decoration: none; font-weight: 500; transition: color 0.3s; }
        .nav-link:hover { color: #2563eb; }

        .contact-button {
          background-color: #3b82f6;
          color: white;
          padding: 8px 24px;
          border-radius: 9999px;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        .contact-button:hover { background-color: #2563eb; }

        .main-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        .hero-section {
          text-align: center;
          padding: 64px 0 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .hero-title { font-family: var(--font-heading); font-size: 46px; font-weight: 800; color: #0f172a; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 12px; }
        .hero-subtitle { color: #374151; font-size: 18px; margin-bottom: 28px; }
        .cta-container { margin-top: 8px; }
        .get-started-button { background: linear-gradient(90deg, #4f46e5, #06b6d4); color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 18px; transition: transform .15s ease, box-shadow .2s ease; box-shadow: 0 10px 18px rgba(79, 70, 229, 0.25); }
        .get-started-button:hover { transform: translateY(-2px); box-shadow: 0 16px 24px rgba(79, 70, 229, 0.35); }

        .hero-gallery {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          align-items: center;
        }
        .hero-gallery img { width: 100%; height: 120px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }

        .feature-section {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(56, 189, 248, 0.95));
          border-radius: 16px;
          overflow: hidden;
          margin: 42px 0 64px;
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.18);
          backdrop-filter: saturate(1.2);
        }
        .feature-content { display: flex; flex-direction: row; }
        .feature-text { width: 50%; padding: 36px 48px; }
        .feature-text h2 { font-size: 30px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .feature-text p { color: #0f172a; margin-bottom: 20px; line-height: 1.6; }
        .start-button { display: inline-block; background-color: #111827; color: white; padding: 10px 22px; border-radius: 9999px; text-decoration: none; font-weight: 600; transition: transform .15s ease, background-color .2s; }
        .start-button:hover { background-color: #0b1220; transform: translateY(-1px); }
        .feature-image { width: 50%; }
        .feature-image img { width: 100%; height: 100%; object-fit: cover; }

        .services-section { padding: 16px 0 8px; }
        .section-title { text-align: center; font-size: 30px; color: #0f172a; margin-bottom: 18px; font-weight: 800; font-family: var(--font-heading); letter-spacing: -0.01em; }

        /* Alternating rows */
        .alt-section { display: flex; flex-direction: column; gap: 28px; }
        .alt-row { display: flex; align-items: center; gap: 24px; background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90)); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 24px rgba(0,0,0,0.12); }
        .alt-row.reverse { flex-direction: row-reverse; }
        .alt-image { flex: 1 1 50%; height: 280px; }
        .alt-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .alt-text { flex: 1 1 50%; padding: 18px 22px; }
        .alt-text h3 { font-family: var(--font-heading); font-size: 22px; color: #111827; margin-bottom: 8px; }
        .alt-text p { color: #4b5563; line-height: 1.6; margin-bottom: 12px; }
        .alt-cta { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; font-weight: 600; padding: 8px 14px; border-radius: 9999px; }
        .alt-cta:hover { background: #2563eb; }

        /* Benefits Section */
        .benefits-section { display: flex; justify-content: space-between; padding: 28px 0 40px; text-align: center; }
        .benefit-item { flex: 1; padding: 0 15px; }
        .benefit-item h3 { font-size: 20px; color: #111827; margin-bottom: 8px; font-weight: 700; }
        .benefit-item p { color: #4b5563; font-size: 16px; }

        /* Divider */
        .divider { border: none; height: 1px; background-color: #e5e7eb; margin: 20px 0; }

        /* Footer */
        .footer { background: transparent; font-family: var(--font-sans); margin-top: 12px; padding: 0; }
        .footer-grid { max-width: 1200px; margin: 0 auto; padding: 28px 24px 16px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 24px; align-items: start; }

        .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .brand-logo { width: 36px; height: 36px; }
        .brand-logo img { width: 100%; height: 100%; object-fit: contain; }
        .brand-name { font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .brand-text { color: #1f2937; line-height: 1.5; }

        .footer-title { font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 10px; }
        .footer-list { display: flex; flex-direction: column; gap: 8px; }
        .footer-link { color: #111827; text-decoration: none; transition: color 0.25s ease; }
        .footer-link:hover { color: #2563eb; }
        .footer-text { color: #374151; }

        .footer-bottom { display: flex; justify-content: center; border-top: 1px solid rgba(15,23,42,0.08); margin-top: 20px; padding-top: 16px; }
        .copyright { color: #4b5563; font-size: 14px; }

        @media (max-width: 992px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr; }
          .footer-inner { padding: 24px 16px; }
        }

        @media (max-width: 992px) {
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-title { font-size: 36px; }
          .hero-gallery { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 768px) {
          .header-container { padding: 16px 24px; flex-direction: column; }
          .logo-container { margin-bottom: 16px; }
          .nav-links { width: 100%; justify-content: center; }

          .hero-title { font-size: 32px; }
          .hero-subtitle { font-size: 16px; padding: 0 16px; }

          .feature-content { flex-direction: column; }
          .feature-text, .feature-image { width: 100%; }
          .feature-text { padding: 24px; }
          .feature-text h2 { font-size: 24px; }

          .hero-gallery img { height: 100px; }
          .benefits-section { flex-direction: column; gap: 30px; padding: 0 16px; }
          .footer-links { flex-direction: column; gap: 15px; }
        }

        @media (max-width: 520px) {
          .services-grid { grid-template-columns: 1fr; }
        }

        /* Small phones */
        @media (max-width: 480px) {
          .hero-title { font-size: 28px; padding: 0 8px; }
          .hero-subtitle { font-size: 14px; }
          .get-started-button { padding: 10px 24px; font-size: 16px; }
          .feature-text h2 { font-size: 20px; }
          .feature-text p { font-size: 14px; }
          .benefit-item h3 { font-size: 18px; }
          .benefit-item p { font-size: 14px; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;