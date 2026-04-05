import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Assuming these assets are available
const IMAGES = {
  logo: '/logo.png',
  hero: '/assets/delivery.png',
  cargo: '/homepagepics/cargoguy.jpg',
  handyman: '/homepagepics/handyman.jpg',
  banking: '/homepagepics/bankingpics.webp',
  delivery: '/homepagepics/deliveryguy.jpg',
};

const HomePage = () => {
  const [isVisible, setIsVisible] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Scroll progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
      document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="errands-homepage">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo">
              <img src={IMAGES.logo} alt="Fagi Errands Logo" />
            </div>
            <h1 className="brand-name">Fagi Errands</h1>
          </div>
          <nav className="nav-links">
            
            <Link to="/signup" className="nav-link signup-btn">Get Started</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section - Life Made Simple */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Got Errands ,<br></br><span className="highlight">Get Fagi</span>
              </h1>
              <p className="hero-subtitle">
                Skip the queues, avoid the rush, and get back to what matters. From banking errands to grocery runs, we handle life's necessities so you don't have to.
              </p>
              
              <div className="hero-cta">
                <Link to="/get-started" className="primary-btn pulse-btn">
                  Start Delegating Tasks
                </Link>
                <a href="/Fagierrands.apk" download="Fagierrands.apk" className="secondary-btn download-apk-btn">
                  <span className="download-icon-inline">📱</span>
                  Download App
                </a>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="floating-tasks">
                <div className="task-bubble banking">Banking Queue</div>
                <div className="task-bubble grocery">Grocery Shopping</div>
                <div className="task-bubble delivery">Package Pickup</div>
                <div className="task-bubble handyman">Home Repairs</div>
              </div>
              <div className="hero-illustration">
                <div className="phone-mockup">
                  <div className="screen">
                    
                      <img src="/homepagepics/app-homepage.webp" alt="Fagi Errands App - Homepage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Simple 3 Steps */}
        
          <h2 className="section-title">Your Personal Errand Assistant in 3 Steps</h2>
          <p className="section-subtitle">No more wasted weekends on mundane tasks</p>
          
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon">📱</div>
              <h3>Tell Us What You Need</h3>
              <p>Banking, shopping, deliveries, or repairs - just describe your task and when you need it done.</p>
            </div>
            
            <div className="step-connector">→</div>
            
            <div className="step">
              <div className="step-icon">🤝</div>
              <h3>We Match You With a Helper</h3>
              <p>Our verified assistants are background-checked, rated, and ready to handle your specific errand.</p>
            </div>
            
            <div className="step-connector">→</div>
            
            <div className="step">
              <div className="step-icon">✅</div>
              <h3>Relax While It Gets Done</h3>
              <p>Track progress in real-time and receive confirmation when your task is completed to your satisfaction.</p>
            </div>
          </div>
      

        {/* Services - What We Handle */}
        <section className="services-showcase" data-animate id="services">
          <h2 className="section-title">We Handle Life's Necessary Inconveniences</h2>
          
          <div className="services-grid">
              <div className="service-card">
                <div className="service-image">
                  <img src={IMAGES.banking} alt="Banking services" />
                  <div className="service-overlay">
                    <div className="service-icon">🏦</div>
                  </div>
                </div>
                <div className="service-content">
                  <h3>Banking & Financial Errands</h3>
                  <p>Skip the queues. We handle deposits, withdrawals, document submissions, and bank visits with complete security and professionalism.</p>
                  <Link to="/signup" className="service-cta">Book Banking Help</Link>
                </div>
              </div>

              <div className="service-card">
                <div className="service-image">
                  <img src={IMAGES.delivery} alt="Pickup and delivery" />
                </div>
                <div className="service-content">
                  <h3>Smart Pickup & Delivery</h3>
                  <p>From groceries to documents, we collect and deliver what you need, when you need it.</p>
                  <Link to="/signup" className="service-cta">Schedule Delivery</Link>
                </div>
              </div>

              <div className="service-card">
                <div className="service-image">
                  <img src={IMAGES.handyman} alt="Handyman services" />
                </div>
                <div className="service-content">
                  <h3>Skilled Home Assistance</h3>
                  <p>Qualified professionals for repairs, installations, and home maintenance tasks.</p>
                  <Link to="/signup" className="service-cta">Find a Pro</Link>
                </div>
              </div>

              <div className="service-card">
                <div className="service-image">
                  <img src={IMAGES.cargo} alt="Cargo services" />
                </div>
                <div className="service-content">
                  <h3>Secure Cargo Transport</h3>
                  <p>Insured, tracked delivery for packages and important items across the city.</p>
                  <Link to="/signup" className="service-cta">Ship Package</Link>
                </div>
              </div>
            </div>
        </section>

        {/* Problem/Solution Section */}
        
          <div className="split-content">
              <div className="problem-side">
                <h2>Your Time is Too Valuable for This</h2>
                <div className="problem-list">
                  <div className="problem-item">
                    <span className="problem-icon">😤</span>
                    <div>
                      <h4>Endless Bank Queues</h4>
                      <p>Hours wasted waiting in line for simple transactions</p>
                    </div>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">🛒</span>
                    <div>
                      <h4>Weekend Shopping Marathons</h4>
                      <p>Precious weekend time lost to grocery runs and errands</p>
                    </div>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">🔧</span>
                    <div>
                      <h4>Finding Reliable Help</h4>
                      <p>Struggling to find trustworthy people for home repairs</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="solution-side">
                <h2>We Give You Your Life Back</h2>
                <div className="solution-list">
                  <div className="solution-item">
                    <span className="solution-icon">⚡</span>
                    <div>
                      <h4>30-Minute Response Time</h4>
                      <p>Quick matching with available, qualified helpers</p>
                    </div>
                  </div>
                  <div className="solution-item">
                    <span className="solution-icon">🛡️</span>
                    <div>
                      <h4>Fully Vetted Assistants</h4>
                      <p>Background-checked, insured, and highly-rated helpers</p>
                    </div>
                  </div>
                  <div className="solution-item">
                    <span className="solution-icon">📱</span>
                    <div>
                      <h4>Complete Transparency</h4>
                      <p>Real-time updates and proof of completion for every task</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
       

        {/* Social Proof / Testimonials */}
        <section className="social-proof" data-animate id="testimonials">
          <h2 className="section-title">Join Thousands Who've Reclaimed Their Time</h2>
          
          <div className="testimonials-grid">
              <div className="testimonial">
                <p>"I used to spend 3 hours every Saturday morning in banking queues. Now I sleep in and my deposits are done by 10 AM."</p>
                <div className="testimonial-author">
                  <strong>Sarah Njeri</strong> - Business Owner
                </div>
              </div>
              
              <div className="testimonial">
                <p>"The handyman they sent fixed my sink perfectly and arrived exactly on time. No more hunting for reliable contractors."</p>
                <div className="testimonial-author">
                  <strong>James Ochieng</strong> - Marketing Manager  
                </div>
              </div>
              
              <div className="testimonial">
                <p>"Game changer for busy parents. Groceries delivered while I'm at work, dinner sorted when I get home."</p>
                <div className="testimonial-author">
                  <strong>Priya L.</strong> - Working Mom
                </div>
              </div>
            </div>

        </section>

        {/* Final CTA */}
        <section className="final-cta" data-animate id="get-started">
          <h2>Ready to Get Your Weekends Back?</h2>
          <p>Start with one simple task. See how much time you can save when someone else handles life's necessities.</p>
          
          <div className="cta-buttons">
            <Link to="/signup" className="primary-btn large-btn">
              Start Your First Task 
            </Link>
          </div>
          
          <div className="cta-guarantee">
            <span>100% satisfaction guarantee or your money back</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={IMAGES.logo} alt="Fagi Errands" />
              <span>Fagi Errands</span>
            </div>
            <p className="brand-tagline">Your trusted partner for life's everyday tasks. Professional, reliable, and always at your service.</p>
            
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Nairobi, Kenya</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>020 7165 601</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>info@fagitone.com</span>
              </div>
            </div>

            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Our Services</h4>
              <Link to="/signup">Banking & Finance</Link>
              <Link to="/signup">Pickup & Delivery</Link>
              <Link to="/signup">Home Services</Link>
              <Link to="/signup">Cargo Transport</Link>
              <Link to="/signup">Personal Assistant</Link>
            </div>
            
            <div className="link-group">
              <h4>Company</h4>
              <Link to="/about">About Fagi Errands</Link>
              <Link to="/how-it-works">How It Works</Link>
            </div>
            
            <div className="link-group">
              <h4>Support & Legal</h4>
              <Link to="/contact">Contact Support</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>

            <div className="link-group">
              <h4>Get Started</h4>
              <Link to="/signup" className="cta-link">Book Your First Task</Link>
              <Link to="/app-download">Mobile App</Link>
            </div>
          </div>
        </div>
        
        
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; 2025 Fagi Errands Ltd. All rights reserved.</p>
            </div>
            <div className="footer-meta">
              <span>Made with ❤️ in Kenya</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Background Elements */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Scroll Progress */}
      <div className="scroll-progress">
        <div className="scroll-bar" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .errands-homepage {
          background: linear-gradient(135deg, #49AFAF 0%, #A8DFF4 100%);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header */
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 80px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-name {
          font-size: 24px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link {
          color: #333;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-link:hover {
          color: #49AFAF;
        }

        .signup-btn {
          background: linear-gradient(135deg, #49AFAF, #A8DFF4);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(73, 175, 175, 0.3);
          transition: all 0.3s ease;
        }

        .signup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(73, 175, 175, 0.4);
          color: white;
        }

        /* Hero Section */
        .hero-section {
          padding: 100px 0 120px;
          position: relative;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .highlight {
          background: linear-gradient(135deg, #1a5b5bff, #bce6f7ff);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 20px;
          color: #444;
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 500px;
        }

        .hero-cta {
          display: flex;
          gap: 20px;
          margin-bottom: 60px;
          flex-wrap: wrap;
        }

        .primary-btn {
          background: linear-gradient(135deg, #49AFAF, #A8DFF4);
          color: white;
          padding: 16px 32px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 8px 25px rgba(73, 175, 175, 0.3);
          transition: all 0.3s ease;
        }

        .primary-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(73, 175, 175, 0.4);
        }

        .pulse-btn {
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 25px rgba(73, 175, 175, 0.3); }
          50% { box-shadow: 0 8px 25px rgba(73, 175, 175, 0.5); }
        }

        .secondary-btn {
          background: transparent;
          color: #333;
          padding: 16px 32px;
          border: 2px solid #333;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .secondary-btn:hover {
          background: #333;
          color: white;
          transform: translateY(-2px);
        }

        .trust-stats {
          display: flex;
          gap: 40px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 900;
          color: #1a1a1a;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        /* Hero Visual */
        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .floating-tasks {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .task-bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px 20px;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          font-weight: 600;
          font-size: 14px;
          animation: float 6s ease-in-out infinite;
        }

        .task-bubble.banking { top: 10%; left: -20%; animation-delay: 0s; }
        .task-bubble.grocery { top: 20%; right: -30%; animation-delay: 1s; }
        .task-bubble.delivery { bottom: 30%; left: -10%; animation-delay: 2s; }
        .task-bubble.handyman { bottom: 10%; right: -20%; animation-delay: 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(-20px); opacity: 1; }
        }

        .phone-mockup {
          width: 280px;
          height: 560px;
          background: linear-gradient(135deg, #333, #555);
          border-radius: 30px;
          padding: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .screen {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 20px;
          overflow: hidden;
        }

        .app-header {
          background: linear-gradient(135deg, #49AFAF, #A8DFF4);
          color: white;
          padding: 20px;
          font-weight: 700;
          font-size: 18px;
          text-align: center;
        }

        .task-list {
          padding: 20px;
        }

        .task-item {
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 12px;
          font-weight: 500;
          border-left: 4px solid;
        }

        .task-item.completed {
          background: #f0f9f0;
          border-left-color: #22c55e;
          color: #15803d;
        }

        .task-item.in-progress {
          background: #fef7e0;
          border-left-color: #f59e0b;
          color: #d97706;
        }

        .task-item.pending {
          background: #f0f4ff;
          border-left-color: #3b82f6;
          color: #1d4ed8;
        }

        /* Download APK Button */
        .download-icon-inline {
          font-size: 20px;
          margin-right: 5px;
        }

        /* How It Works Section */
        .how-it-works {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 100px 0;
          border-radius: 30px 30px 0 0;
          margin-top: -30px;
          position: relative;
          z-index: 10;
        }

        .section-title {
          font-size: 48px;
          font-weight: 800;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 18px;
          color: #666;
          text-align: center;
          margin-bottom: 60px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 40px;
          align-items: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .step {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .step:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .step-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .step h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .step p {
          color: #666;
          line-height: 1.5;
        }

        .step-connector {
          font-size: 24px;
          color: #49AFAF;
          font-weight: bold;
        }

        /* Services Showcase */
        .services-showcase {
          padding: 100px 0;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-top: 60px;
        }

        .service-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.4s ease;
        }

        .service-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }

        .service-card.major {
          grid-row: span 2;
        }

        .service-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .service-card.major .service-image {
          height: 300px;
        }

        .service-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .service-card:hover .service-image img {
          transform: scale(1.1);
        }

        .service-overlay {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-icon {
          font-size: 24px;
        }

        .service-content {
          padding: 30px;
        }

        .service-content h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .service-content p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .service-features {
          list-style: none;
          margin-bottom: 25px;
        }

        .service-features li {
          color: #22c55e;
          font-weight: 500;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .service-cta {
          display: inline-block;
          background: linear-gradient(135deg, #49AFAF, #A8DFF4);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .service-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(73, 175, 175, 0.3);
        }

        /* Problem/Solution Section */
        .problem-solution {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          padding: 100px 0;
        }

        .split-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: flex-start;
        }

        .problem-side h2,
        .solution-side h2 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 40px;
          letter-spacing: -0.02em;
        }

        .problem-side h2 {
          color: #dc2626;
        }

        .solution-side h2 {
          color: #059669;
        }

        .problem-list,
        .solution-list {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .problem-item,
        .solution-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 25px;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .problem-item {
          background: rgba(220, 38, 38, 0.05);
          border-left: 4px solid #dc2626;
        }

        .solution-item {
          background: rgba(5, 150, 105, 0.05);
          border-left: 4px solid #059669;
        }

        .problem-item:hover,
        .solution-item:hover {
          transform: translateX(10px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .problem-icon,
        .solution-icon {
          font-size: 32px;
          flex-shrink: 0;
          margin-top: 5px;
        }

        .problem-item h4,
        .solution-item h4 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a1a;
        }

        .problem-item p,
        .solution-item p {
          color: #666;
          line-height: 1.5;
        }

        /* Social Proof Section */
        .social-proof {
          padding: 100px 0;
          background: linear-gradient(135deg, rgba(73, 175, 175, 0.1), rgba(168, 223, 244, 0.1));
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
          margin: 60px 0;
        }

        .testimonial {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          position: relative;
          transition: all 0.3s ease;
        }

        .testimonial:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .testimonial::before {
          content: '"';
          position: absolute;
          top: 10px;
          left: 20px;
          font-size: 60px;
          color: rgba(73, 175, 175, 0.3);
          font-family: serif;
        }

        .testimonial p {
          font-size: 18px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 20px;
          font-style: italic;
        }

        .testimonial-author {
          font-weight: 600;
          color: #49AFAF;
        }

        .trust-indicators {
          display: flex;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
          margin-top: 60px;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 16px 24px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          font-weight: 600;
          color: #333;
          transition: all 0.3s ease;
        }

        .trust-badge:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .trust-icon {
          font-size: 20px;
        }

        /* Final CTA Section */
        .final-cta {
          padding: 100px 0;
          text-align: center;
        }

        .final-cta h2 {
          font-size: 48px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .final-cta p {
          font-size: 20px;
          color: #666;
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .large-btn {
          font-size: 20px;
          padding: 20px 40px;
          background: white;
          color: #49AFAF;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }

        .large-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          color: #49AFAF;
        }

        .cta-guarantee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 30px;
          color: #444;
          font-weight: 500;
        }

        .guarantee-icon {
          font-size: 20px;
        }

        /* Footer */
        .footer {
          background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(15, 15, 15, 0.98));
          backdrop-filter: blur(20px);
          color: white;
          padding: 80px 0 0;
          margin-top: 100px;
          position: relative;
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(73, 175, 175, 0.5), transparent);
        }

        .footer-main {
          width: 100%;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 1.8fr 3fr;
          gap: 80px;
          margin-bottom: 60px;
          max-width: none;
        }

        .footer-brand {
          max-width: 400px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .footer-logo img {
          width: 48px;
          height: 48px;
          border-radius: 12px;
        }

        .footer-logo span {
          font-size: 24px;
          font-weight: 800;
          color: white;
        }

        .brand-tagline {
          color: #b3b3b3;
          line-height: 1.7;
          margin-bottom: 32px;
          font-size: 16px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ccc;
          font-size: 15px;
        }

        .contact-icon {
          font-size: 16px;
          width: 20px;
        }

        .social-links {
          display: flex;
          gap: 16px;
        }

        .social-link {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social-link:hover {
          background: rgba(73, 175, 175, 0.2);
          color: #A8DFF4;
          transform: translateY(-2px);
          border-color: rgba(73, 175, 175, 0.3);
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
        }

        .link-group h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 24px;
          color: white;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .link-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .link-group a {
          color: #b3b3b3;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 14px;
          line-height: 1.4;
          padding: 2px 0;
        }

        .link-group a:hover {
          color: #A8DFF4;
          padding-left: 8px;
        }

        .link-group a.cta-link {
          background: linear-gradient(135deg, #49AFAF, #A8DFF4);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 8px;
          text-align: center;
        }

        .link-group a.cta-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(73, 175, 175, 0.3);
          padding-left: 16px;
        }

        .footer-certifications {
          width: 100%;
          padding: 40px 40px 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cert-badges {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .cert-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }

        .cert-badge:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .cert-icon {
          font-size: 24px;
          width: 32px;
          text-align: center;
        }

        .cert-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cert-title {
          font-weight: 600;
          color: white;
          font-size: 14px;
        }

        .cert-desc {
          font-size: 12px;
          color: #999;
        }

        .footer-bottom {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 32px 0;
        }

        .footer-bottom-content {
          width: 100%;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .copyright {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .copyright p {
          color: #999;
          font-size: 14px;
          margin: 0;
        }

        .company-reg {
          font-size: 12px !important;
          color: #666 !important;
        }

        .footer-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #999;
          font-size: 14px;
        }

        .footer-meta a {
          color: #ccc;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-meta a:hover {
          color: #A8DFF4;
        }

        /* Mobile Responsiveness */
        @media (max-width: 1024px) {
          .footer-main {
            grid-template-columns: 1fr;
            gap: 60px;
            padding: 0 30px;
          }

          .footer-certifications {
            padding: 40px 30px;
          }

          .footer-bottom-content {
            padding: 0 30px;
          }

          .footer-links {
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
          }

          .cert-badges {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .footer {
            padding: 60px 0 0;
          }

          .footer-main {
            gap: 48px;
            padding: 0 20px;
          }

          .footer-certifications {
            padding: 40px 20px;
          }

          .footer-bottom-content {
            padding: 0 20px;
          }

          .footer-links {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .cert-badges {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .footer-bottom-content {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .footer-meta {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        /* Background Shapes */
        .background-shapes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float-shape 20s infinite linear;
        }

        .shape-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #A8DFF4, transparent);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #49AFAF, transparent);
          top: 50%;
          right: 20%;
          animation-delay: 10s;
        }

        .shape-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #A8DFF4, transparent);
          bottom: 20%;
          left: 30%;
          animation-delay: 15s;
        }

        @keyframes float-shape {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-50px) rotate(180deg); }
        }

        /* Scroll Progress */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          z-index: 9999;
        }

        .scroll-bar {
          height: 100%;
          background: linear-gradient(90deg, #49AFAF, #A8DFF4);
          transition: width 0.2s ease;
          box-shadow: 0 0 10px rgba(73, 175, 175, 0.5);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 60px;
            text-align: center;
          }

          .hero-title {
            font-size: 48px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .step-connector {
            display: none;
          }

          .services-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .split-content {
            grid-template-columns: 1fr;
            gap: 60px;
          }

          .footer-main {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 20px;
          }

          .hero-title {
            font-size: 40px;
          }

          .hero-subtitle {
            font-size: 18px;
          }

          .hero-cta {
            flex-direction: column;
            align-items: center;
            gap: 15px;
          }

          .trust-stats {
            gap: 20px;
          }

          .section-title {
            font-size: 36px;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .trust-indicators {
            gap: 20px;
          }

          .trust-badge {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .final-cta h2 {
            font-size: 36px;
          }

          .footer-main {
            grid-template-columns: 1fr;
            gap: 30px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .header-container {
            padding: 0 15px;
          }

          .nav-links {
            gap: 15px;
          }

          .nav-link {
            font-size: 14px;
          }

          .signup-btn {
            padding: 10px 18px;
            font-size: 14px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .primary-btn,
          .secondary-btn {
            padding: 14px 24px;
            font-size: 15px;
          }

          .phone-mockup {
            width: 220px;
            height: 440px;
          }

          .task-bubble {
            font-size: 12px;
            padding: 8px 12px;
          }

          .section-title {
            font-size: 28px;
          }

          .step {
            padding: 30px 20px;
          }

          .step h3 {
            font-size: 18px;
          }

          .problem-side h2,
          .solution-side h2 {
            font-size: 28px;
          }

          .final-cta h2 {
            font-size: 28px;
          }

          .large-btn {
            font-size: 18px;
            padding: 16px 32px;
          }
        }

        /* Animation delays for staggered entrance */
        .step:nth-child(1) { animation-delay: 0.1s; }
        .step:nth-child(3) { animation-delay: 0.2s; }
        .step:nth-child(5) { animation-delay: 0.3s; }

        .service-card:nth-child(1) { animation-delay: 0.1s; }
        .service-card:nth-child(2) { animation-delay: 0.2s; }
        .service-card:nth-child(3) { animation-delay: 0.3s; }
        .service-card:nth-child(4) { animation-delay: 0.4s; }

        .testimonial:nth-child(1) { animation-delay: 0.1s; }
        .testimonial:nth-child(2) { animation-delay: 0.2s; }
        .testimonial:nth-child(3) { animation-delay: 0.3s; }

        /* Accessibility improvements */
        .nav-link:focus,
        .primary-btn:focus,
        .secondary-btn:focus,
        .service-cta:focus {
          outline: 2px solid #49AFAF;
          outline-offset: 2px;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;