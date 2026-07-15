import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import logo from '../assets/LOGO.png';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

function Counter({ target, suffix = '+' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const { t } = useLanguage();
  
  const stats = [
    { value: 500, label: t('familiesHelped'), icon: '🏠', color: '#2563eb' },
    { value: 100, label: t('eventsConducted'), icon: '🎯', color: '#10b981' },
    { value: 1000, label: t('mealsServed'), icon: '🍱', color: '#f59e0b' },
    { value: 50, label: t('volunteers'), icon: '🤝', color: '#8b5cf6' },
  ];

  const features = [
    { icon: '❤️', title: t('foodDistribution'), desc: t('foodDistributionDesc'), color: '#fef2f2', accent: '#ef4444' },
    { icon: '🎓', title: t('educationSupport'), desc: t('educationSupportDesc'), color: '#eff6ff', accent: '#2563eb' },
    { icon: '🏥', title: t('medicalAid'), desc: t('medicalAidDesc'), color: '#f0fdf4', accent: '#10b981' },
    { icon: '🌊', title: t('disasterRelief'), desc: t('disasterReliefDesc'), color: '#faf5ff', accent: '#8b5cf6' },
  ];
  
  return (
    <div className="hp">
      {/* HERO */}
      <section className="hp-hero">
        <div className="hp-hero-bg">
          <div className="hp-orb hp-orb-1" />
          <div className="hp-orb hp-orb-2" />
          <div className="hp-orb hp-orb-3" />
          <div className="hp-grid" />
        </div>
        <div className="hp-hero-inner">
          <motion.div className="hp-badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <span className="hp-badge-dot" /> {t('servingTamilNadu')}
          </motion.div>
          <motion.div className="hp-logo-wrap" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.7, type: 'spring', stiffness: 100 }}>
            <div className="hp-logo-ring" />
            <img src={logo} alt="Sivam Trust" className="hp-logo" />
          </motion.div>
          <motion.h1 className="hp-hero-h1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
            {t('buildingHope')}.<br /><span className="hp-grad">{t('creatingImpact')}.</span>
          </motion.h1>
          <motion.p className="hp-hero-tag" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            {t('helpingPoor')} • {t('servingLove')}
          </motion.p>
          <motion.p className="hp-hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            அங்காள பரமேஸ்வரி துணை | ஆத்திஸ்வர சுவாமி துணை
          </motion.p>
          <motion.div className="hp-hero-btns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
            <Link to="/donate">
              <motion.button className="hp-btn-blue" whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(37,99,235,0.45)' }} whileTap={{ scale: 0.97 }}>
                {t('donateNow')} →
              </motion.button>
            </Link>
            <Link to="/contact">
              <motion.button className="hp-btn-ghost" whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }} whileTap={{ scale: 0.97 }}>
                {t('contactUs')}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="hp-stats">
        <div className="hp-container">
          <div className="hp-stats-grid">
            {stats.map((s, i) => (
              <motion.div key={i} className="hp-stat-card"
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div className="hp-stat-icon" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
                <h3 className="hp-stat-num" style={{ color: s.color }}><Counter target={s.value} /></h3>
                <p className="hp-stat-lbl">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="hp-about">
        <div className="hp-container">
          <div className="hp-about-grid">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="hp-label">{t('about')}</span>
              <h2 className="hp-h2">{t('ourMission')}<br /><span className="hp-grad">{t('transformingLives')}</span></h2>
              <p className="hp-p">{t('missionDesc')}</p>
              <p className="hp-p">Founded by <strong>Sivaganesh J</strong>, our mission is to serve with love and compassion, ensuring no one goes without basic needs.</p>
              <div className="hp-tags">
                <span className="hp-tag">🌱 Est. 2026</span>
                <span className="hp-tag">📍 Tamil Nadu</span>
                <span className="hp-tag">💙 Non-Profit</span>
              </div>
              <Link to="/donate">
                <motion.button className="hp-btn-blue" style={{ marginTop: '2rem' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  {t('donate')} →
                </motion.button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="hp-mission-cards">
                {[
                  { icon: '🎯', title: t('ourMission'), desc: 'To eliminate hunger and poverty through community-driven initiatives and compassionate action.' },
                  { icon: '👁️', title: t('ourVision'), desc: t('visionDesc') },
                  { icon: '💎', title: 'Our Values', desc: 'Compassion, transparency, integrity and community first — always.' },
                ].map((m, i) => (
                  <motion.div key={i} className="hp-mission-card" whileHover={{ x: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    <span>{m.icon}</span>
                    <div><h4>{m.title}</h4><p>{m.desc}</p></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="hp-features">
        <div className="hp-container">
          <motion.div className="hp-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="hp-label">What We Do</span>
            <h2 className="hp-h2">{t('makeImpact')} <span className="hp-grad">Every Day</span></h2>
            <p className="hp-p" style={{ maxWidth: 500, margin: '1rem auto 0' }}>From food distribution to education support — we are there for every need.</p>
          </motion.div>
          <div className="hp-feat-grid">
            {features.map((f, i) => (
              <motion.div key={i} className="hp-feat-card"
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6 }}
                whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
                <div className="hp-feat-icon" style={{ background: f.color, color: f.accent }}>{f.icon}</div>
                <h3 className="hp-feat-title">{f.title}</h3>
                <p className="hp-feat-desc">{f.desc}</p>
                <div className="hp-feat-line" style={{ background: f.accent }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hp-cta">
        <div className="hp-cta-bg">
          <div className="hp-cta-orb-1" /><div className="hp-cta-orb-2" />
        </div>
        <div className="hp-container hp-center" style={{ position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="hp-label" style={{ color: '#93c5fd' }}>{t('makeADifference')}</span>
            <h2 className="hp-cta-h2">{t('joinUs')} in Building<br />a Better Tomorrow</h2>
            <p className="hp-cta-sub">Your small contribution can change someone's life forever.</p>
            <div className="hp-hero-btns">
              <Link to="/donate">
                <motion.button className="hp-btn-white" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>{t('donateNow')} →</motion.button>
              </Link>
              <Link to="/events">
                <motion.button className="hp-btn-ghost" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>View {t('events')}</motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}