import React from 'react';
import { Link } from 'react-router-dom';
import './FeaturesPage.css';

export default function FeaturesPage() {
  return (
    <div className="features-page">
      <header className="hero">
          <h1>Features</h1>
          <p className="subtitle">Powerful tools that make errands simplefrom order to delivery.</p>
      </header>

      <main>
        {/* Highlights */}
        <section className="grid three">
          <article className="card feature">
            <div className="icon">📦</div>
            <h3>Real-time Tracking</h3>
            <p>Watch your task progress liveget alerts at each milestone until its done.</p>
          </article>
          <article className="card feature">
            <div className="icon">🛡️</div>
            <h3>Secure Payments</h3>
            <p>Safe, verified payments and receiptsno surprises, fully transparent.</p>
          </article>
          <article className="card feature">
            <div className="icon">🧰</div>
            <h3>Vetted Assistants</h3>
            <p>Experienced, reliable pros for delivery, handyman, and banking tasks.</p>
          </article>
        </section>

        {/* Services grid */}
        <section>
          <h2 className="section-title">What you can do</h2>
          <div className="grid four">
            <article className="tool card">
              <h4>Cargo & Courier</h4>
              <ul>
                <li>Same-day and scheduled</li>
                <li>Insured handling</li>
                <li>Live status updates</li>
              </ul>
            </article>
            <article className="tool card">
              <h4>Pickup & Delivery</h4>
              <ul>
                <li>Groceries and essentials</li>
                <li>Documents & parcels</li>
                <li>Door-to-door</li>
              </ul>
            </article>
            <article className="tool card">
              <h4>Handyman Services</h4>
              <ul>
                <li>Repairs & installations</li>
                <li>Upfront pricing</li>
                <li>On-time arrival</li>
              </ul>
            </article>
            <article className="tool card">
              <h4>Banking Assistance</h4>
              <ul>
                <li>Deposits & withdrawals</li>
                <li>Queue handled for you</li>
                <li>Secure handoff</li>
              </ul>
            </article>
          </div>
        </section>

        {/* CTA band */}
        <section className="cta">
          <div className="cta-inner card">
            <div>
              <h3>Ready to get more done?</h3>
              <p>Create a task in minutes and track it live.</p>
            </div>
            <div className="cta-actions">
              <Link to="/get-started" className="cta-btn">Get Started</Link>
              <Link to="/login" className="secondary-btn">Log in</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}