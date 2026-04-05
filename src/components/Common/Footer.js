import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          {/* Company Info */}
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <div className="flex justify-between items-center md:block">
              <h3 className="text-xl font-bold mb-4">Fagi Errands</h3>
              <button 
                className="md:hidden text-gray-400"
                onClick={() => toggleSection('company')}
                aria-label="Toggle company info"
              >
                {expandedSection === 'company' ? '−' : '+'}
              </button>
            </div>
            <div className={`${expandedSection === 'company' ? 'block' : 'hidden'} md:block`}>
              <p className="text-gray-400">
                Your reliable errand service for all your delivery and shopping needs.
              </p>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <div className="flex justify-between items-center md:block">
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <button 
                className="md:hidden text-gray-400"
                onClick={() => toggleSection('links')}
                aria-label="Toggle quick links"
              >
                {expandedSection === 'links' ? '−' : '+'}
              </button>
            </div>
            <ul className={`${expandedSection === 'links' ? 'block' : 'hidden'} md:block`}>
              <li className="mb-2">
                <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
              </li>
              <li className="mb-2">
                <Link to="/services/shop" className="text-gray-400 hover:text-white">Shop</Link>
              </li>
              <li className="mb-2">
                <Link to="/services/pickup-delivery" className="text-gray-400 hover:text-white">Pickup & Delivery</Link>
              </li>
              <li className="mb-2">
                <Link to="/services/cargo-delivery" className="text-gray-400 hover:text-white">Cargo Delivery</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <div className="flex justify-between items-center md:block">
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <button 
                className="md:hidden text-gray-400"
                onClick={() => toggleSection('contact')}
                aria-label="Toggle contact info"
              >
                {expandedSection === 'contact' ? '−' : '+'}
              </button>
            </div>
            <ul className={`${expandedSection === 'contact' ? 'block' : 'hidden'} md:block`}>
              <li className="mb-2 text-gray-400">
                <i className="fa fa-envelope mr-2"></i> support@fagierrands.com
              </li>
              <li className="mb-2 text-gray-400">
                <i className="fa fa-phone mr-2"></i> +1 (555) 123-4567
              </li>
              <li className="mb-2 text-gray-400">
                <i className="fa fa-map-marker mr-2"></i> 123 Main Street, City
              </li>
            </ul>
          </div>
          
          {/* Social Media */}
          <div className="w-full md:w-1/4">
            <div className="flex justify-between items-center md:block">
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <button 
                className="md:hidden text-gray-400"
                onClick={() => toggleSection('social')}
                aria-label="Toggle social media"
              >
                {expandedSection === 'social' ? '−' : '+'}
              </button>
            </div>
            <div className={`flex space-x-4 ${expandedSection === 'social' ? 'block' : 'hidden'} md:flex`}>
              <a href="https://facebook.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Fagi Errands. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;