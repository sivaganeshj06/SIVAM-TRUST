import React from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/LOGO.png';
import './LoadingScreen.css';

export default function LoadingScreen({ fullPage = true }) {
  return (
    <div className={`trust-loading-container ${fullPage ? 'full-page' : 'inline'}`}>
      <div className="trust-loading-card">
        <div className="logo-spinner-wrapper">
          <motion.div
            className="logo-glow"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.img
            src={logo}
            alt="Sivam Trust Foundation"
            className="trust-loading-logo"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        <motion.p
          className="trust-loading-text"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading Trust Portal...
        </motion.p>
      </div>
    </div>
  );
}
