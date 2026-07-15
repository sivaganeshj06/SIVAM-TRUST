import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Donate.css';
import { API } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

const presetAmounts = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export default function Donate() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ donor_name: '', email: '', phone: '', amount: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  const impacts = [
    { icon: '🍚', amount: '₹100', desc: t('feedsFamily') },
    { icon: '📚', amount: '₹500', desc: t('schoolSupplies') },
    { icon: '🏥', amount: '₹1000', desc: t('medicalAid') },
    { icon: '🏠', amount: '₹2500', desc: t('basicNeeds') },
  ];

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
          <span className="dn-label">{t('makeADifference')}</span>
          <h1 className="dn-hero-h1">{t('yourGenerosity')}<br /><span className="dn-grad">{t('changesLives')}</span></h1>
          <p className="dn-hero-sub">{t('everyRupee')}</p>
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
            <span className="dn-label">{t('whyDonate')}</span>
            <h2 className="dn-h2">{t('everyContribution')}<br /><span className="dn-grad">{t('matters')}</span></h2>
            <div className="dn-reasons">
              {[
                { icon: '🍚', text: t('provideFood') },
                { icon: '📚', text: t('supportEducation') },
                { icon: '🏥', text: t('helpMedical') },
                { icon: '🏠', text: t('basicNeeds') },
                { icon: '🌱', text: t('communityDev') },
              ].map((r, i) => (
                <motion.div key={i} className="dn-reason" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <span>{r.icon}</span><p>{r.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="dn-bank-card">
              <div className="dn-bank-header">
                <span className="dn-bank-icon">🏦</span>
                <h3>{t('bankTransfer')}</h3>
              </div>
              <div className="dn-bank-row"><span>{t('accountName')}</span><strong>Sivam Trust Foundation</strong></div>
              <div className="dn-bank-row"><span>{t('phone')}</span><strong>79045 71160 | 96005 05873</strong></div>
              <div className="dn-bank-row"><span>{t('founder')}</span><strong>Sivaganesh J</strong></div>
            </div>

            <div className="dn-security">
              <span className="dn-sec-badge">🔒 {t('secure')}</span>
              <span className="dn-sec-badge">✅ {t('verified')}</span>
              <span className="dn-sec-badge">💙 {t('transparent')}</span>
            </div>
          </motion.div>

          {/* RIGHT FORM */}
          <motion.div className="dn-form-card" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" className="dn-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="dn-success-icon">🎉</div>
                  <h3>{t('thankYou')}</h3>
                  <p>{t('donationReceived')}</p>
                  <p className="dn-success-quote">"Thank you for your generous contribution. Your donation has been successfully received. Your support helps us continue our mission."</p>
                  <motion.button className="dn-btn-blue" onClick={() => setSuccess(false)} whileHover={{ scale: 1.05 }}>{t('donateAgain')}</motion.button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="dn-form-title">{t('donorDetails')}</h2>
                  <p className="dn-form-sub">Fill in your details to complete the donation</p>

                  {/* Preset amounts */}
                  <div className="dn-presets">
                    <p className="dn-preset-label">{t('selectAmount')}</p>
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
                      <label>{t('name')} *</label>
                      <input type="text" name="donor_name" placeholder={t('name')} value={form.donor_name} onChange={handleChange} required />
                    </div>
                    <div className="dn-field">
                      <label>{t('email')} *</label>
                      <input type="email" name="email" placeholder={t('email')} value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="dn-field">
                      <label>{t('phone')}</label>
                      <input type="tel" name="phone" placeholder={t('phone')} value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="dn-field">
                      <label>{t('amount')} (₹) *</label>
                      <input type="number" name="amount" placeholder={t('enterAmount')} value={form.amount} onChange={e => { handleChange(e); setSelectedAmount(null); }} required />
                    </div>
                    <motion.button type="submit" className="dn-btn-blue dn-submit" disabled={loading}
                      whileHover={{ scale: 1.02, boxShadow: '0 16px 40px rgba(37,99,235,0.4)' }}
                      whileTap={{ scale: 0.98 }}>
                      {loading ? (
                        <span className="dn-loading"><span className="dn-spinner" /> Processing...</span>
                      ) : (
                        `❤️ ${t('submitDonation')}`
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