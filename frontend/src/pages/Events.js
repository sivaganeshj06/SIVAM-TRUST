import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Events.css';
import { API } from '../utils/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API}/api/events`);
      const eventsWithPhotos = await Promise.all(
        res.data.map(async (event) => {
          try {
            const photoRes = await axios.get(`${API}/api/photos/${event.id}`);
            return { ...event, photos: photoRes.data };
          } catch { return { ...event, photos: [] }; }
        })
      );
      setEvents(eventsWithPhotos);
    } catch {}
    setLoading(false);
  };

  const filtered = filter === 'all' ? events : events.filter(e => (e.status || 'upcoming') === filter);

  return (
    <div className="ev">
      {/* HERO */}
      <section className="ev-hero">
        <div className="ev-hero-bg"><div className="ev-orb-1" /><div className="ev-orb-2" /></div>
        <motion.div className="ev-hero-inner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="ev-label">Community Events</span>
          <h1 className="ev-hero-h1">Our Events & <span className="ev-grad">Initiatives</span></h1>
          <p className="ev-hero-sub">See what we have been doing for the community across Tamil Nadu</p>
        </motion.div>
      </section>

      {/* FILTER */}
      <div className="ev-filter-bar">
        <div className="ev-filter-inner">
          {['all', 'upcoming', 'completed'].map(f => (
            <motion.button key={f} className={`ev-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {f === 'all' ? '🌐 All' : f === 'upcoming' ? '📅 Upcoming' : '✅ Completed'}
            </motion.button>
          ))}
          <span className="ev-count">{filtered.length} events</span>
        </div>
      </div>

      {/* EVENTS */}
      <section className="ev-main">
        <div className="ev-container">
          {loading ? (
            <div className="ev-loading">
              {[1,2,3].map(i => <div key={i} className="ev-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div className="ev-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>📭</span>
              <h3>No events found</h3>
              <p>Check back soon for upcoming events!</p>
            </motion.div>
          ) : (
            <div className="ev-list">
              {filtered.map((event, i) => (
                <motion.div key={event.id} className="ev-card"
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.1)' }}>
                  <div className="ev-card-header">
                    <span className={`ev-status ${event.status || 'upcoming'}`}>
                      {event.status === 'completed' ? '✅ Completed' : '📅 Upcoming'}
                    </span>
                    <div className="ev-card-meta">
                      <span>📅 {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                  </div>
                  <h2 className="ev-card-title">{event.title}</h2>
                  {event.description && <p className="ev-card-desc">{event.description}</p>}
                  {event.photos?.length > 0 && (
                    <div className="ev-photos">
                      <h4 className="ev-photos-title">📷 Event Photos ({event.photos.length})</h4>
                      <div className="ev-photo-grid">
                        {event.photos.map((photo, idx) => (
                          <motion.div key={photo.id} className="ev-photo-item"
                            onClick={() => setLightbox({ photos: event.photos, index: idx })}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <img src={photo.photo_url} alt={photo.caption || event.title} loading="lazy" />
                            <div className="ev-photo-overlay"><span>🔍</span></div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="ev-lightbox" onClick={() => setLightbox(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="ev-lightbox-inner" onClick={e => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <button className="ev-lb-close" onClick={() => setLightbox(null)}>✕</button>
              <button className="ev-lb-prev" onClick={() => setLightbox(p => ({ ...p, index: (p.index - 1 + p.photos.length) % p.photos.length }))}>‹</button>
              <img src={lightbox.photos[lightbox.index].photo_url} alt="Event" className="ev-lb-img" />
              {lightbox.photos[lightbox.index].caption && <p className="ev-lb-caption">{lightbox.photos[lightbox.index].caption}</p>}
              <button className="ev-lb-next" onClick={() => setLightbox(p => ({ ...p, index: (p.index + 1) % p.photos.length }))}>›</button>
              <div className="ev-lb-counter">{lightbox.index + 1} / {lightbox.photos.length}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}