import React from 'react';
import { Link } from 'react-router-dom';

export default function GetStartedPage() {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <h1>Get Started</h1>
      <p style={{ marginTop: 12 }}>
        Create an account or log in to start placing orders. Choose a service, set your pickup and delivery, and confirm your price.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link className="get-started-button" to="/signup">Sign Up</Link>
        <Link className="start-button" to="/login">Login</Link>
      </div>
    </div>
  );
}