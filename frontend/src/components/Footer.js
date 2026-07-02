import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/LOGO.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="ft">
      <div className="ft-top">
        <div className="ft-orb-1" /><div className="ft-orb-2" />
        <div className="ft-container">
          <div className="ft-brand">
            <div className="ft-logo-wrap">
              <img src={logo} alt="Sivam Trust" className="ft-logo" />
            </div>
            <h3 className="ft-name">Sivam Trust Foundation</h3>
            <p className="ft-tag">Helping the Poor • Serving with Love</p>
            <p className="ft-sub"> அங்காள பரமேஸ்வரி துணை | ஆத்திஸ்வர சுவாமி துணை</p>
            <div className="ft-socials">
              <motion.a href="https://www.instagram.com/sivamtrustfoundation" target="_blank" rel="noreferrer" className="ft-social-btn" whileHover={{ scale: 1.1, y: -2 }}>📸</motion.a>
              <motion.a href="https://www.youtube.com/@SIVAMTRUST" target="_blank" rel="noreferrer" className="ft-social-btn" whileHover={{ scale: 1.1, y: -2 }}>▶️</motion.a>
              <motion.a href="https://chat.whatsapp.com/BVyZDaeoRwJJANus8TEHyH" target="_blank" rel="noreferrer" className="ft-social-btn" whileHover={{ scale: 1.1, y: -2 }}>💬</motion.a>
            </div>
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">Quick Links</h4>
            {[['/', 'Home'], ['/donate', 'Donate'], ['/events', 'Events'], ['/team', 'Our Team'], ['/contact', 'Contact']].map(([to, label]) => (
              <Link key={to} to={to} className="ft-link">{label}</Link>
            ))}
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">Contact Us</h4>
            <p className="ft-contact-item">📞 79045 71160</p>
            <p className="ft-contact-item">📞 96005 05873</p>
            <p className="ft-contact-item">👤 Founder: Sivaganesh J</p>
            <a href="https://www.instagram.com/sivamtrustfoundation" target="_blank" rel="noreferrer" className="ft-link">📸 Instagram</a>
            <a href="https://www.youtube.com/@SIVAMTRUST" target="_blank" rel="noreferrer" className="ft-link">▶️ YouTube</a>
            <a href="https://chat.whatsapp.com/BVyZDaeoRwJJANus8TEHyH" target="_blank" rel="noreferrer" className="ft-link">💬 WhatsApp</a>
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">Support Us</h4>
            <p className="ft-p">Every donation, big or small, makes a real difference in someone's life.</p>
            <Link to="/donate">
              <motion.button className="ft-donate-btn" whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }} whileTap={{ scale: 0.97 }}>
                Donate Now →
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      <div className="ft-bottom">
        <div className="ft-container ft-bottom-inner">
          <p>© 2026 Sivam Trust Foundation. All Rights Reserved.</p>
          <div className="ft-bottom-badges">
            <span className="ft-badge">🔒 Secure</span>
            <span className="ft-badge">✅ Verified NGO</span>
            <span className="ft-badge">💙 Non-Profit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}