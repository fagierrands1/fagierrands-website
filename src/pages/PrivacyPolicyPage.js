import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Effective Date: July 22nd 2025</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <p>
              This Privacy Policy for Fagi Errands Limited ("we", "us", or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
            </p>
            <ul>
              <li>Visit our website or any website of ours that links to this Privacy Policy</li>
              <li>Download and use our mobile application, or any other application of ours that links to this Privacy Policy</li>
              <li>Engage with us in other related ways, including any sales, marketing or events</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>1. Privacy Policy of Fagi Errands Limited</h2>
            <p>
              Fagi Errands Limited operates the Fagi Errands Application and website, which offers errands, delivery, and home maintenance services.
            </p>
            <p>
              This page is used to inform Application users and website visitors regarding our policies with the collection, use, and disclosure of Personal Information if anyone decided to use our Application or Website.
            </p>
            <p>
              If you choose to use our Service, then you agree to the collection and use of information in relation with this policy. The Personal Information that we collect are used for providing and improving the Service. We will not use or share your information with anyone except as described in this Privacy Policy.
            </p>
            <p>
              The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which is accessible at our website, unless otherwise defined in this Privacy Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Data Collection and Scope</h2>
            <p>
              Fagi Errands collects specific personal and transactional data to facilitate the smooth operation of our services. The data collected includes, but is not limited to, names, contact information (phone and email), delivery and pickup addresses, payment history, and errand logs. During active errands, the app will collect and use location data to provide real-time tracking for both clients and service providers. Clients may also be required to upload images of goods for verification purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Log Data</h2>
            <p>
              We would like to inform you that whenever you visit our Website or Application, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser version, pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Purpose and Use of Data</h2>
            <p>
              All data collected is used strictly for service delivery, operational analysis, and support. Specifically, it helps us match clients with appropriate service providers, coordinate tasks, facilitate secure payment processing, and issue receipts. Data is also used to improve app functionality, monitor service quality, generate user ratings, and—when consent is given—send occasional promotional content relevant to your errand preferences and history.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Cookies</h2>
            <p>
              Cookies are files with small amount of data that is commonly uses an anonymous unique identifier. These are sent to your browser from the website that you visit and are stored on your computer's hard drive.
            </p>
            <p>
              Our website uses these "cookies" to collect information and to improve our Service. You have the option to either accept or refuse these cookies, and know when a cookie is being sent to your computer. If you choose to refuse our cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Sharing and Third Parties</h2>
            <p>
              Fagi Errands does not sell or commercially distribute user data to third parties. However, certain data will be shared with trusted partners strictly for operational purposes. These include payment processors such as Safaricom (M-Pesa), Visa, and Global Pay, as well as partner supermarkets for receipt verification and price synchronization. In cases involving damage claims, relevant data may be shared with insurance partners to facilitate compensation processes. In accordance with applicable laws, we may also share personal data with regulatory bodies or legal authorities if officially required.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Security of Data</h2>
            <p>
              We prioritize the security of your data. All information shared within the app is encrypted using SSL protocols during transmission. Sensitive data is also stored in encrypted databases and protected using strict access controls. For added user security, two-factor authentication is supported. Our development team performs regular audits to ensure the app's security features are up to date and robust.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights and Controls</h2>
            <p>
              You have the right to access, correct, or delete your personal information at any time. Account deletion and associated data removal can be requested by contacting our support team through the app or email. Users may also opt out of promotional communications via the settings section of the app. You are entitled to download a summary of your transaction history upon request.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Data Retention</h2>
            <p>
              Personal data is retained only as long as is necessary to complete requested errands, resolve disputes, support auditing, or meet legal obligations. Once this period elapses, your data is permanently deleted or anonymized to protect your privacy and prevent misuse.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Policy Updates</h2>
            <p>
              We may revise this Privacy Policy occasionally to reflect operational changes, legal compliance, or system upgrades. Any significant updates will be communicated to users via app notifications or email. Continued use of the Fagi Errands app after such updates constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Information</h2>
            <p>
              For inquiries, data requests, or support, you may contact the Fagi Errands team:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> support@fagierrands.com</p>
              <p><strong>Website:</strong> <a href="https://fagierrand.fagitone.com" target="_blank" rel="noopener noreferrer">fagierrand.fagitone.com</a></p>
              <p><strong>Corporate Address:</strong> Next Gen Mall, Mombasa Road, 3rd Floor</p>
            </div>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/" className="back-link">← Back to Home</Link>
          <div>
            <Link to="/terms" className="related-link">View Terms and Conditions</Link>
            <Link to="/how-to-delete-account" className="related-link" style={{ marginLeft: '1rem' }}>How to Delete Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;