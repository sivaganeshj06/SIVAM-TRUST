import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/LOGO.png';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrollY / docHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/donate', label: 'Donate' },
    { to: '/events', label: 'Events' },
    { to: '/team', label: 'Our Team' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Scroll progress bar */}
      <div className="nav-progress-bar">
        <motion.div
          className="nav-progress-fill"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <motion.nav
        className={`navbar-premium ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nav-inner">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            <motion.div
              className="nav-logo-wrap"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <img src={logo} alt="Sivam Trust" className="nav-logo" />
              <div className="nav-logo-glow" />
            </motion.div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">Sivam Trust</span>
              <span className="nav-brand-sub">Foundation</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="nav-links-desktop">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to) ? 'active' : ''}`}>
                {link.label}
                {isActive(link.to) && (
                  <motion.div
                    className="nav-link-underline"
                    layoutId="underline"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="nav-right">
            <Link to="/donate" className="nav-cta-btn">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Donate Now
              </motion.button>
            </Link>
            <button
              className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="nav-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={link.to}
                    className={`nav-mobile-link ${isActive(link.to) ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Link to="/donate" onClick={() => setMenuOpen(false)}>
                  <button className="nav-mobile-cta">Donate Now →</button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

export default Navbar;