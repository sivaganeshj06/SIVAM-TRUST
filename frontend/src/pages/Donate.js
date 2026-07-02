import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Donate.css';

const API = process.env.REACT_APP_API_URL || 'https://sivam-trust.vercel.app';

const presetAmounts = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

const impacts = [
  { icon: '🍚', amount: '₹100', desc: 'Feeds a family for a day' },
  { icon: '📚', amount: '₹500', desc: 'School supplies for a child' },
  { icon: '🏥', amount: '₹1000', desc: 'Medical aid for one person' },
  { icon: '🏠', amount: '₹2500', desc: 'Basic needs for a week' },
];

export default function Donate() {
  const [form, setForm] = useState({ donor_name: '', email: '', phone: '', amount: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePreset = (amt) => {
    setSelectedAmount(amt);
    setForm({ ...form, amount: amt.toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/donations`, form);
      setSuccess(true);
      setForm({ donor_name: '', email: '', phone: '', amount: '' });
      setSelectedAmount(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="dn">
      {/* HERO */}
      <section className="dn-hero">
        <div className="dn-hero-bg">
          <div className="dn-orb-1" /><div className="dn-orb-2" />
        </div>
        <motion.div className="dn-hero-inner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="dn-label">Make a Difference</span>
          <h1 className="dn-hero-h1">Your Generosity<br /><span className="dn-grad">Changes Lives</span></h1>
          <p className="dn-hero-sub">Every rupee you donate directly helps the poor and needy in Tamil Nadu.</p>
        </motion.div>
      </section>

      {/* IMPACT */}
      <section className="dn-impact">
        <div className="dn-container">
          <div className="dn-impact-grid">
            {impacts.map((item, i) => (
              <motion.div key={i} className="dn-impact-card"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(37,99,235,0.1)' }}>
                <span className="dn-impact-icon">{item.icon}</span>
                <h4 className="dn-impact-amt">{item.amount}</h4>
                <p className="dn-impact-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="dn-main">
        <div className="dn-container dn-grid">
          {/* LEFT INFO */}
          <motion.div className="dn-info" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="dn-label">Why Donate?</span>
            <h2 className="dn-h2">Every Contribution<br /><span className="dn-grad">Matters</span></h2>
            <div className="dn-reasons">
              {[
                { icon: '🍚', text: 'Provide food to hungry families' },
                { icon: '📚', text: 'Support education for children' },
                { icon: '🏥', text: 'Help with medical needs' },
                { icon: '🏠', text: 'Basic needs for the homeless' },
                { icon: '🌱', text: 'Community development programs' },
              ].map((r, i) => (
                <motion.div key={i} className="dn-reason" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <span>{r.icon}</span><p>{r.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="dn-bank-card">
              <div className="dn-bank-header">
                <span className="dn-bank-icon">🏦</span>
                <h3>Bank Transfer Details</h3>
              </div>
              <div className="dn-bank-row"><span>Account Name</span><strong>Sivam Trust Foundation</strong></div>
              <div className="dn-bank-row"><span>Phone</span><strong>79045 71160 | 96005 05873</strong></div>
              <div className="dn-bank-row"><span>Founder</span><strong>Sivaganesh J</strong></div>
            </div>

            <div className="dn-security">
              <span className="dn-sec-badge">🔒 100% Secure</span>
              <span className="dn-sec-badge">✅ Verified NGO</span>
              <span className="dn-sec-badge">💙 Transparent</span>
            </div>
          </motion.div>

          {/* RIGHT FORM */}
          <motion.div className="dn-form-card" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" className="dn-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="dn-success-icon">🎉</div>
                  <h3>Thank You!</h3>
                  <p>Your generous donation has been received. You are making a real difference in someone's life🫶.</p>
                  <p className="dn-success-quote">"Thank you for your generous contribution. Your donation has been successfully received. Your support helps us continue our mission."</p>
                  <motion.button className="dn-btn-blue" onClick={() => setSuccess(false)} whileHover={{ scale: 1.05 }}>Donate Again</motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="dn-form-title">Donor Details</h2>
                  <p className="dn-form-sub">Fill in your details to complete the donation</p>

                  {/* Preset amounts */}
                  <div className="dn-presets">
                    <p className="dn-preset-label">Select Amount</p>
                    <div className="dn-preset-grid">
                      {presetAmounts.map(amt => (
                        <motion.button key={amt} type="button"
                          className={`dn-preset-btn ${selectedAmount === amt ? 'selected' : ''}`}
                          onClick={() => handlePreset(amt)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                          ₹{amt.toLocaleString()}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <motion.div className="dn-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      ⚠️ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="dn-form">
                    <div className="dn-field">
                      <label>Full Name *</label>
                      <input type="text" name="donor_name" placeholder="yourname" value={form.donor_name} onChange={handleChange} required />
                    </div>
                    <div className="dn-field">
                      <label>Email Address *</label>
                      <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="dn-field">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" placeholder="your phone no" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="dn-field">
                      <label>Donation Amount (₹) *</label>
                      <input type="number" name="amount" placeholder="Enter amount" value={form.amount} onChange={e => { handleChange(e); setSelectedAmount(null); }} required />
                    </div>
                    <motion.button type="submit" className="dn-btn-blue dn-submit" disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: '0 16px 40px rgba(37,99,235,0.4)' }}
                      whileTap={{ scale: 0.98 }}>
                      {loading ? (
                        <span className="dn-loading"><span className="dn-spinner" /> Processing...</span>
                      ) : (
                        '❤️ Submit Donation'
                      )}
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