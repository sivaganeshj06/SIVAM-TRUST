import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar, Heart, TrendingUp, Bell, LogOut, Home, ChevronRight, CheckCircle, Clock, Activity, Menu, X, Sun, Moon, FileText } from 'lucide-react';
import './CoFounderDashboard.css';
import { API } from '../utils/api';
import LoadingScreen from '../components/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';

function Counter({ target, prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0; const duration = 1500; const increment = target / (duration / 16);
    const timer = setInterval(() => { start += increment; if (start >= target) { setCount(target); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}</span>;
}

export default function CoFounderDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', end_date: '', location: '' });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, { headers });
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/${id}/read`, {}, { headers });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  useEffect(() => {
    if (!token || !trustUser?.role) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!['co-founder-1', 'co-founder-2'].includes(trustUser.role)) {
      navigate('/access-denied', { replace: true });
      return;
    }
    
    fetchAll();
    fetchNotifications();

    const eventSource = new EventSource(`${API}/api/notifications/stream?token=${token}`);
    
    eventSource.onmessage = (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications((prev) => [newNotif, ...prev]);
        if (['donation', 'message', 'event'].includes(newNotif.type)) {
          fetchAll();
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const [don, evt] = await Promise.all([axios.get(`${API}/api/donations`, { headers }), axios.get(`${API}/api/events`, { headers })]);
      setDonations(don.data || []); setEvents(evt.data || []);
    } catch (err) { 
      console.error('Error fetching data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('trust_user');
        navigate('/admin/login', { replace: true });
      } else if (err.response?.status === 403) {
        navigate('/access-denied', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('token'); 
    localStorage.removeItem('trust_user'); 
    setTimeout(() => navigate('/admin/login', { replace: true }), 200);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try { await axios.post(`${API}/api/events`, newEvent, { headers }); setNewEvent({ title: '', description: '', event_date: '', end_date: '', location: '' }); fetchAll(); }
    catch (err) { alert(err.response?.data?.error || 'Error adding event!'); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await axios.delete(`${API}/api/events/${id}`, { headers }); fetchAll(); } catch { alert('Error deleting event!'); }
  };

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const pendingDonations = donations.filter(d => d.payment_status === 'pending').length;
  const donationChartData = donations.length > 0 ? donations.slice(0, 6).map((d, i) => ({ name: `#${i + 1}`, amount: Number(d.amount || 0) })).reverse() : [];

  const navItems = useMemo(() => [
    { id: 'overview', label: t('overview'), icon: Home },
    { id: 'events', label: t('events'), icon: Calendar },
    { id: 'donations', label: t('donations'), icon: Heart },
    { id: 'analytics', label: t('analytics'), icon: TrendingUp },
    { id: 'reports', label: t('reports'), icon: FileText },
  ], [t]);

  if (loading) return <LoadingScreen fullPage={true} />;

  return (
    <div className={`cfx-root ${darkMode ? 'dark' : ''}`}>
      <motion.aside className={`cfx-sidebar ${sidebarOpen ? 'open' : 'closed'}`} initial={{ x: -240 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
        <div className="cfx-sidebar-header">
          <div className="cfx-logo">ST</div>
          {sidebarOpen && <span className="cfx-logo-text">Sivam Trust</span>}
          <button className="cfx-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {sidebarOpen && (
          <div className="cfx-user-info">
            <div className="cfx-user-avatar">{trustUser?.name?.charAt(0)}</div>
            <div><p className="cfx-user-name">{trustUser?.name}</p><p className="cfx-user-role">{t('coFounder')}</p></div>
          </div>
        )}
        <nav className="cfx-nav">
          {navItems.map((item, i) => (
            <motion.button key={item.id} className={`cfx-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }}>
              <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>
        <div className="cfx-sidebar-footer">
          <button className="cfx-nav-item" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}{sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'} Mode</span>}</button>
          <button className="cfx-nav-item logout" onClick={handleLogout}><LogOut size={20} />{sidebarOpen && <span>{t('logout')}</span>}</button>
        </div>
      </motion.aside>

      <main className="cfx-main">
        <motion.header className="cfx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div><h1 className="cfx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1><p className="cfx-breadcrumb">{t('coFounder')} <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p></div>
          <div className="cfx-header-right" style={{ position: 'relative' }}>
            <div 
              className="cfx-notif-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700'
                }}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>

            {/* Notifications Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '45px',
                    width: '320px',
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    color: darkMode ? '#f1f5f9' : '#0f172a'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>Notifications</span>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        style={{
                          fontSize: '11px',
                          color: '#2563eb',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                            backgroundColor: n.is_read ? 'transparent' : (darkMode ? '#334155' : '#eff6ff'),
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{n.title}</span>
                            {!n.is_read && <span style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />}
                          </div>
                          <span style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', textAlign: 'left' }}>{n.message}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', textAlign: 'left' }}>
                            {new Date(n.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <span className="cfx-role-badge">{t('coFounder')}</span>
          </div>
        </motion.header>

        <div className="cfx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="cfx-stats-grid">
                  {[
                    { icon: Heart, label: t('totalDonations'), value: totalDonations, prefix: '₹', color: 'emerald', sub: `${donations.length} donors` },
                    { icon: Calendar, label: t('upcomingEvents'), value: upcomingEvents, color: 'blue', sub: `${completedEvents} ${t('completed')}` },
                    { icon: Clock, label: t('pendingDonations'), value: pendingDonations, color: 'amber', sub: 'Awaiting payment' },
                    { icon: CheckCircle, label: `Total ${t('events')}`, value: events.length, color: 'violet', sub: 'All time' },
                  ].map((kpi, i) => (
                    <motion.div key={i} className={`cfx-stat-card ${kpi.color}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                      <div className="cfx-stat-icon"><kpi.icon size={22} /></div>
                      <div><p className="cfx-stat-label">{kpi.label}</p><h3 className="cfx-stat-value"><Counter target={kpi.value} prefix={kpi.prefix || ''} /></h3><p className="cfx-stat-sub">{kpi.sub}</p></div>
                    </motion.div>
                  ))}
                </div>
                <div className="cfx-charts-row">
                  <motion.div className="cfx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h3>Donation Amounts</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={donationChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `₹${v}`} /><Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={1200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                  <motion.div className="cfx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3>Event Overview</h3>
                    <div className="cfx-event-stats">
                      <div className="cfx-event-stat"><div className="cfx-event-stat-icon upcoming"><Calendar size={20} /></div><div><p>Upcoming</p><h4>{upcomingEvents}</h4></div></div>
                      <div className="cfx-event-stat"><div className="cfx-event-stat-icon completed"><CheckCircle size={20} /></div><div><p>Completed</p><h4>{completedEvents}</h4></div></div>
                      <div className="cfx-event-stat"><div className="cfx-event-stat-icon total"><Activity size={20} /></div><div><p>Total</p><h4>{events.length}</h4></div></div>
                    </div>
                  </motion.div>
                </div>
                <motion.div className="cfx-table-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="cfx-table-header"><h3>{t('recentDonations')}</h3><button onClick={() => setActiveTab('donations')} className="cfx-view-all">{t('viewAll')} →</button></div>
                  {donations.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      <Heart size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>No donations yet</p>
                      <p style={{ fontSize: '12px' }}>Donations will appear here once received</p>
                    </div>
                  ) : (
                    <table className="cfx-table">
                      <thead><tr><th>{t('name')}</th><th>{t('amount')}</th><th>{t('status')}</th><th>{t('date')}</th></tr></thead>
                      <tbody>{donations.slice(0, 5).map(d => (
                        <tr key={d.id}><td><div className="cfx-table-user"><div className="cfx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td><span className={`cfx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>
                      ))}</tbody>
                    </table>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="cfx-two-col">
                  <div className="cfx-form-card">
                    <h3>Add New Event</h3>
                    <form onSubmit={handleAddEvent} className="cfx-form">
                      <input type="text" placeholder="Event Title *" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
                      <textarea placeholder="Description" rows="3" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                      <label>Start Date</label><input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                      <label>End Date</label><input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })} />
                      <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                      <motion.button type="submit" className="cfx-btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Add Event</motion.button>
                    </form>
                  </div>
                  <div className="cfx-events-list-col">
                    <h3>All Events</h3>
                    {events.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <Calendar size={50} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>No events created yet</p>
                        <p style={{ fontSize: '12px' }}>Add your first event using the form</p>
                      </div>
                    ) : (
                      events.map((e, i) => (
                        <motion.div className="cfx-event-item" key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                          <div><div className="cfx-event-item-header"><h4>{e.title}</h4><span className={`cfx-status ${e.status || 'upcoming'}`}>{e.status || 'upcoming'}</span></div><p>{e.description}</p><p className="cfx-event-meta">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN') : '-'} | 📍 {e.location || 'TBD'}</p></div>
                          <button onClick={() => handleDeleteEvent(e.id)} className="cfx-delete-btn">Delete</button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'donations' && (
              <motion.div key="donations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="cfx-table-card">
                  <h3>All Donations</h3>
                  {donations.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <Heart size={60} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>No Donations Yet</h3>
                      <p style={{ fontSize: '14px' }}>Donation records will appear here once people start contributing</p>
                    </div>
                  ) : (
                    <table className="cfx-table">
                      <thead><tr><th>Donor</th><th>Email</th><th>Phone</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>{donations.map(d => (
                        <tr key={d.id}><td><div className="cfx-table-user"><div className="cfx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td><td>{d.email}</td><td>{d.phone || '-'}</td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td><span className={`cfx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="cfx-chart-card">
                <h3>Donation Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={donationChartData}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => `₹${v}`} /><Legend />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="cfx-table-card">
                <h3>Summary Report</h3>
                <div className="cfx-report-grid">
                  <div className="cfx-report-item"><p>Total Donations</p><h3>₹{totalDonations.toLocaleString()}</h3></div>
                  <div className="cfx-report-item"><p>Total Events</p><h3>{events.length}</h3></div>
                  <div className="cfx-report-item"><p>Events Completed</p><h3>{completedEvents}</h3></div>
                  <div className="cfx-report-item"><p>Events Upcoming</p><h3>{upcomingEvents}</h3></div>
                  <div className="cfx-report-item"><p>Total Donors</p><h3>{donations.length}</h3></div>
                  <div className="cfx-report-item"><p>Pending Donations</p><h3>{pendingDonations}</h3></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}