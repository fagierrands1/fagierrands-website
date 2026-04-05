import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="hero">
          <h1>About Fagi Errands</h1>
          <p className="subtitle">We make everyday tasks effortless with trusted help—fast, reliable, and secure.</p>
      </header>

      <main>
        {/* Mission */}
        <section className="card mission">
          <h2>Our Mission</h2>
          <p>
            To give you back your time. Whether its delivering a package, handling a quick installation, or
            helping with banking queues, we connect you with vetted assistants who get it done rightevery time.
          </p>
        </section>

        {/* Why Choose Us */}
        <section>
          <h2 className="section-title">Why Choose Fagi</h2>
          <div className="grid three">
            <article className="card feature">
              <div className="icon">⚡</div>
              <h3>Speed & Convenience</h3>
              <p>Same-day options, real-time updates, and simple payments to keep your day moving.</p>
            </article>
            <article className="card feature">
              <div className="icon">🔒</div>
              <h3>Trusted & Secure</h3>
              <p>Vetted assistants, careful handling, and transparent tracking for peace of mind.</p>
            </article>
            <article className="card feature">
              <div className="icon">📍</div>
              <h3>Where You Are</h3>
              <p>Coverage focused on your cityfrom CBD to neighborhoodsright when you need it.</p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section className="how">
          <h2 className="section-title">How It Works</h2>
          <ol className="steps">
            <li>
              <h4>Tell us what you need</h4>
              <p>Create a task in minutescargo, handyman, delivery, or banking help.</p>
            </li>
            <li>
              <h4>We match you instantly</h4>
              <p>Get paired with a trusted assistant and track progress live.</p>
            </li>
            <li>
              <h4>Done & paid securely</h4>
              <p>Approve the task, rate the experience, and pay safelyall in one place.</p>
            </li>
          </ol>
        </section>

        {/* CTA */}
        <section className="cta">
          <Link to="/get-started" className="cta-btn">Get Started</Link>
          <Link to="/features" className="secondary-btn">See Features</Link>
        </section>
      </main>
    </div>
  );
}