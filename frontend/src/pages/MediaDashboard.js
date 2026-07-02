import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image, Bell, LogOut, Home, ChevronRight, Menu, X, Sun, Moon, CheckCircle, Clock } from 'lucide-react';
import './MediaDashboard.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function MediaDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventPhotos, setEventPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allPhotos, setAllPhotos] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !['media', 'founder'].includes(trustUser?.role)) { navigate('/admin/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await axios.get(`${API}/api/events`, { headers });
      setEvents(res.data || []);
      const photosArr = [];
      for (const evt of res.data || []) {
        try { const photoRes = await axios.get(`${API}/api/photos/${evt.id}`); photosArr.push(...(photoRes.data || []).map(p => ({ ...p, event_title: evt.title }))); } catch {}
      }
      setAllPhotos(photosArr);
    } catch (err) { if (err.response?.status === 401) navigate('/admin/login'); }
    setLoading(false);
  };

  const fetchEventPhotos = async (eventId) => {
    try { const res = await axios.get(`${API}/api/photos/${eventId}`); setEventPhotos(res.data || []); } catch { setEventPhotos([]); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('trust_user'); navigate('/admin/login'); };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFiles.length || !selectedEventId) { alert('Please select an event and at least one photo!'); return; }
    setUploading(true); setUploadProgress(0);
    try {
      const formData = new FormData();
      photoFiles.forEach(f => formData.append('photos', f));
      formData.append('event_id', selectedEventId);
      formData.append('title', photoTitle);
      formData.append('caption', photoCaption);
      await axios.post(`${API}/api/photos/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setPhotoFiles([]); setPhotoTitle(''); setPhotoCaption('');
      fetchEventPhotos(selectedEventId); fetchAll();
    } catch (err) { alert(err.response?.data?.error || 'Error uploading photos!'); }
    setUploading(false); setUploadProgress(0);
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    try { await axios.delete(`${API}/api/photos/${id}`, { headers }); fetchEventPhotos(selectedEventId); fetchAll(); } catch { alert('Error deleting photo!'); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setPhotoFiles(files);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'upload', label: 'Upload Photos', icon: Upload },
    { id: 'gallery', label: 'Photo Gallery', icon: Image },
  ];

  if (loading) return (
    <div className={`mdx-loading ${darkMode ? 'dark' : ''}`}>
      <motion.div className="mdx-logo-reveal" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: 'spring' }}>ST</motion.div>
      <div className="mdx-skeleton-rows">{[1,2,3].map(i => <div key={i} className="mdx-skeleton-row" style={{ animationDelay: `${i*0.1}s` }} />)}</div>
    </div>
  );

  return (
    <div className={`mdx-root ${darkMode ? 'dark' : ''}`}>
      <motion.aside className={`mdx-sidebar ${sidebarOpen ? 'open' : 'closed'}`} initial={{ x: -240 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
        <div className="mdx-sidebar-header">
          <div className="mdx-logo">ST</div>{sidebarOpen && <span className="mdx-logo-text">Sivam Trust</span>}
          <button className="mdx-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {sidebarOpen && (<div className="mdx-user-info"><div className="mdx-user-avatar">{trustUser?.name?.charAt(0)}</div><div><p className="mdx-user-name">{trustUser?.name}</p><p className="mdx-user-role">Media</p></div></div>)}
        <nav className="mdx-nav">
          {navItems.map((item, i) => (
            <motion.button key={item.id} className={`mdx-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }}>
              <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>
        <div className="mdx-sidebar-footer">
          <button className="mdx-nav-item" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}{sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'} Mode</span>}</button>
          <button className="mdx-nav-item logout" onClick={handleLogout}><LogOut size={20} />{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </motion.aside>

      <main className="mdx-main">
        <motion.header className="mdx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div><h1 className="mdx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1><p className="mdx-breadcrumb">Media <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p></div>
          <div className="mdx-header-right"><div className="mdx-notif-btn"><Bell size={20} /></div><span className="mdx-role-badge">Media</span></div>
        </motion.header>

        <div className="mdx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mdx-stats-grid">
                  {[
                    { icon: Camera, label: 'Total Photos', value: allPhotos.length, color: 'purple', sub: 'All events' },
                    { icon: Image, label: 'Total Events', value: events.length, color: 'blue', sub: 'With photos' },
                    { icon: CheckCircle, label: 'Completed Events', value: events.filter(e => e.status === 'completed').length, color: 'green', sub: 'Done' },
                    { icon: Clock, label: 'Upcoming Events', value: events.filter(e => e.status === 'upcoming').length, color: 'amber', sub: 'Coming soon' },
                  ].map((kpi, i) => (
                    <motion.div key={i} className={`mdx-stat-card ${kpi.color}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                      <div className="mdx-stat-icon"><kpi.icon size={22} /></div>
                      <div><p className="mdx-stat-label">{kpi.label}</p><h3 className="mdx-stat-value">{kpi.value}</h3><p className="mdx-stat-sub">{kpi.sub}</p></div>
                    </motion.div>
                  ))}
                </div>
                <div className="mdx-events-grid">
                  {events.map((evt, i) => {
                    const count = allPhotos.filter(p => p.event_id === evt.id).length;
                    return (
                      <motion.div className="mdx-event-card" key={evt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.08 }}
                        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(139,92,246,0.15)' }}
                        onClick={() => { setActiveTab('upload'); setSelectedEventId(evt.id); fetchEventPhotos(evt.id); }}>
                        <div className="mdx-event-card-header"><span className={`mdx-status ${evt.status || 'upcoming'}`}>{evt.status || 'upcoming'}</span><span className="mdx-photo-count"><Camera size={14} /> {count} photos</span></div>
                        <h3>{evt.title}</h3><p>{evt.location || 'No location'}</p>
                        <div className="mdx-event-card-footer"><span>📅 {evt.event_date ? new Date(evt.event_date).toLocaleDateString('en-IN') : '-'}</span><button className="mdx-upload-btn">Upload Photos →</button></div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mdx-upload-layout">
                <div className="mdx-upload-form-card">
                  <h3>Upload Event Photos</h3>
                  <form onSubmit={handlePhotoUpload} className="mdx-form">
                    <label>Select Event</label>
                    <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); if (e.target.value) fetchEventPhotos(e.target.value); }} required>
                      <option value="">-- Select Event --</option>
                      {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
                    </select>
                    <label>Photo Title</label>
                    <input type="text" placeholder="Title (optional)" value={photoTitle} onChange={e => setPhotoTitle(e.target.value)} />
                    <label>Caption</label>
                    <input type="text" placeholder="Caption (optional)" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} />
                    <label>Select Photos</label>
                    <div className={`mdx-dropzone ${dragOver ? 'dragover' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={e => setPhotoFiles(Array.from(e.target.files))} required />
                      <Upload size={28} />
                      <p>{photoFiles.length > 0 ? `${photoFiles.length} file(s) selected` : 'Drag & drop or click to select'}</p>
                    </div>
                    {uploading && (
                      <div className="mdx-progress-bar"><motion.div className="mdx-progress-fill" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} /></div>
                    )}
                    <motion.button type="submit" className="mdx-btn-primary" disabled={uploading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {uploading ? `Uploading ${uploadProgress}%...` : <><Upload size={16} /> Upload Photos</>}
                    </motion.button>
                  </form>
                </div>

                {selectedEventId && (
                  <div className="mdx-photos-preview">
                    <h3>Uploaded Photos ({eventPhotos.length})</h3>
                    <div className="mdx-photo-grid">
                      {eventPhotos.length === 0 ? (
                        <div className="mdx-no-photos"><Camera size={40} /><p>No photos yet</p></div>
                      ) : eventPhotos.map((photo, i) => (
                        <motion.div className="mdx-photo-item" key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i*0.05 }}>
                          <img src={photo.photo_url} alt={photo.caption || 'Event'} />
                          <div className="mdx-photo-overlay">
                            {photo.title && <p className="mdx-photo-title">{photo.title}</p>}
                            {photo.caption && <p className="mdx-photo-caption">{photo.caption}</p>}
                            <button onClick={() => handleDeletePhoto(photo.id)} className="mdx-delete-btn">Delete</button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mdx-gallery-filter">
                  <h3>All Photos ({allPhotos.length})</h3>
                  <div className="mdx-gallery-events">{events.map(e => <span key={e.id} className="mdx-gallery-event-tag">{e.title} ({allPhotos.filter(p => p.event_id === e.id).length})</span>)}</div>
                </div>
                <div className="mdx-gallery-grid">
                  {allPhotos.map((photo, i) => (
                    <motion.div className="mdx-gallery-item" key={photo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.03 }} whileHover={{ scale: 1.02 }}>
                      <img src={photo.photo_url} alt={photo.caption || 'Event'} />
                      <div className="mdx-gallery-overlay"><p className="mdx-gallery-event">{photo.event_title}</p>{photo.caption && <p className="mdx-gallery-caption">{photo.caption}</p>}</div>
                    </motion.div>
                  ))}
                  {allPhotos.length === 0 && (<div className="mdx-no-photos-full"><Camera size={60} /><h3>No photos yet</h3><p>Upload photos from the Upload tab</p></div>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}