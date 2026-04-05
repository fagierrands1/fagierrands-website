import React, { useState } from 'react';
import './ContactPage.css';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder submit behavior
    setStatus('Thanks! We\'ve received your message and will reply shortly.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="contact-page">
      <header className="hero">
          <h1>Contact Us</h1>
          <p className="subtitle">Were here 24/7. Reach us via phone or send a quick message.</p>
      </header>

      <main className="grid two">
        {/* Contact Info */}
        <section className="card info">
          <h2>Talk to us</h2>
          <ul className="list">
            <li><strong>Phone:</strong> <a href="tel:0207165601">0207165601</a></li>
            <li><strong>Support:</strong> 24/7</li>
          </ul>
          <div className="help-text">Prefer WhatsApp or email? Add your preference in the message.</div>
        </section>

        {/* Form */}
        <section className="card form">
          <h2>Send a message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows="4" value={form.message} onChange={handleChange} required />
            </label>
            <button type="submit" className="cta-btn">Send</button>
            {status && <div className="status">{status}</div>}
          </form>
        </section>
      </main>
    </div>
  );
}