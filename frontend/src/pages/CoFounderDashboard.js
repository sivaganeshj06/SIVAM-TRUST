import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar, Heart, Users, TrendingUp, Bell, LogOut, Home, ChevronRight, CheckCircle, Clock, Activity, Menu, X, Sun, Moon, FileText } from 'lucide-react';
import './CoFounderDashboard.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', end_date: '', location: '' });

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !['co-founder', 'founder'].includes(trustUser?.role)) { navigate('/admin/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [don, evt] = await Promise.all([axios.get(`${API}/api/donations`, { headers }), axios.get(`${API}/api/events`, { headers })]);
      setDonations(don.data || []); setEvents(evt.data || []);
    } catch (err) { if (err.response?.status === 401) navigate('/admin/login'); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('trust_user'); navigate('/admin/login'); };

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
  const donationChartData = donations.slice(0, 6).map((d, i) => ({ name: `#${i + 1}`, amount: Number(d.amount) })).reverse();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'donations', label: 'Donations', icon: Heart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  if (loading) return (
    <div className={`cfx-loading ${darkMode ? 'dark' : ''}`}>
      <motion.div className="cfx-logo-reveal" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: 'spring' }}>ST</motion.div>
      <div className="cfx-skeleton-rows">{[1, 2, 3].map(i => <div key={i} className="cfx-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>
    </div>
  );

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
            <div><p className="cfx-user-name">{trustUser?.name}</p><p className="cfx-user-role">Co-Founder</p></div>
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
          <button className="cfx-nav-item logout" onClick={handleLogout}><LogOut size={20} />{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </motion.aside>

      <main className="cfx-main">
        <motion.header className="cfx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div><h1 className="cfx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1><p className="cfx-breadcrumb">Co-Founder <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p></div>
          <div className="cfx-header-right"><div className="cfx-notif-btn"><Bell size={20} /></div><span className="cfx-role-badge">Co-Founder</span></div>
        </motion.header>

        <div className="cfx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="cfx-stats-grid">
                  {[
                    { icon: Heart, label: 'Total Donations', value: totalDonations, prefix: '₹', color: 'emerald', sub: `${donations.length} donors` },
                    { icon: Calendar, label: 'Upcoming Events', value: upcomingEvents, color: 'blue', sub: `${completedEvents} completed` },
                    { icon: Clock, label: 'Pending Donations', value: pendingDonations, color: 'amber', sub: 'Awaiting payment' },
                    { icon: CheckCircle, label: 'Total Events', value: events.length, color: 'violet', sub: 'All time' },
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
                  <div className="cfx-table-header"><h3>Recent Donations</h3><button onClick={() => setActiveTab('donations')} className="cfx-view-all">View All →</button></div>
                  <table className="cfx-table">
                    <thead><tr><th>Donor</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>{donations.slice(0, 5).map(d => (
                      <tr key={d.id}><td><div className="cfx-table-user"><div className="cfx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td><span className={`cfx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>
                    ))}</tbody>
                  </table>
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
                    {events.map((e, i) => (
                      <motion.div className="cfx-event-item" key={e.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <div><div className="cfx-event-item-header"><h4>{e.title}</h4><span className={`cfx-status ${e.status || 'upcoming'}`}>{e.status || 'upcoming'}</span></div><p>{e.description}</p><p className="cfx-event-meta">📅 {e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN') : '-'} | 📍 {e.location || 'TBD'}</p></div>
                        <button onClick={() => handleDeleteEvent(e.id)} className="cfx-delete-btn">Delete</button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'donations' && (
              <motion.div key="donations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="cfx-table-card">
                  <h3>All Donations</h3>
                  <table className="cfx-table">
                    <thead><tr><th>Donor</th><th>Email</th><th>Phone</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>{donations.map(d => (
                      <tr key={d.id}><td><div className="cfx-table-user"><div className="cfx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td><td>{d.email}</td><td>{d.phone || '-'}</td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td><span className={`cfx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>
                    ))}</tbody>
                  </table>
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