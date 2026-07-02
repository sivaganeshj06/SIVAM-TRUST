import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Contact.css';

const API = 'https://sivam-trust.vercel.app';

const contactInfo = [
  { icon: '📞', title: 'Phone', lines: ['79045 71160', '96005 05873'] },
  { icon: '👤', title: 'Founder', lines: ['Sivaganesh J'] },
  { icon: '📸', title: 'Instagram', links: [{ href: 'https://www.instagram.com/sivamtrustfoundation', text: '@sivamtrustfoundation' }] },
  { icon: '▶️', title: 'YouTube', links: [{ href: 'https://www.youtube.com/@SIVAMTRUST', text: '@SIVAMTRUST' }] },
  { icon: '💬', title: 'WhatsApp', links: [{ href: 'https://chat.whatsapp.com/BVyZDaeoRwJJANus8TEHyH', text: 'Join our WhatsApp Group' }] },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/api/contact`, form);
      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="ct">
      <section className="ct-hero">
        <div className="ct-hero-bg"><div className="ct-orb-1" /><div className="ct-orb-2" /></div>
        <motion.div className="ct-hero-inner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="ct-label">Get In Touch</span>
          <h1 className="ct-hero-h1">We'd Love to <span className="ct-grad">Hear From You</span></h1>
          <p className="ct-hero-sub">Reach out for donations, volunteering, or any queries about our work.</p>
        </motion.div>
      </section>

      <section className="ct-main">
        <div className="ct-container ct-grid">
          <motion.div className="ct-info" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="ct-label">Contact Info</span>
            <h2 className="ct-h2">Always Here <span className="ct-grad">For You</span></h2>
            <div className="ct-cards">
              {contactInfo.map((info, i) => (
                <motion.div key={i} className="ct-info-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ x: 4 }}>
                  <div className="ct-info-icon">{info.icon}</div>
                  <div>
                    <h4>{info.title}</h4>
                    {info.lines?.map((l, j) => <p key={j}>{l}</p>)}
                    {info.links?.map((l, j) => <a key={j} href={l.href} target="_blank" rel="noreferrer">{l.text}</a>)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="ct-form-card" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" className="ct-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="ct-success-icon">✅</div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <motion.button className="ct-btn-blue" onClick={() => setSuccess(false)} whileHover={{ scale: 1.05 }}>Send Another</motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="ct-form-title">Send a Message</h2>
                  <p className="ct-form-sub">We'll respond within 24 hours</p>
                  {error && <div className="ct-error">⚠️ {error}</div>}
                  <form onSubmit={handleSubmit} className="ct-form">
                    <div className="ct-field">
                      <label>Full Name *</label>
                      <input type="text" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="ct-field">
                      <label>Email Address *</label>
                      <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="ct-field">
                      <label>Message *</label>
                      <textarea name="message" placeholder="How can we help you?" rows="5" value={form.message} onChange={handleChange} required />
                    </div>
                    <motion.button type="submit" className="ct-btn-blue ct-submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {loading ? <span className="ct-spinner" /> : '📨 Send Message'}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </div>
  );
}