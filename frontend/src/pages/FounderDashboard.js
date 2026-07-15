import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, Heart, Calendar, MessageSquare, TrendingUp,
  Bell, LogOut, Home, ChevronRight, Shield,
  DollarSign, CheckCircle, Clock, Menu, X, Sun, Moon
} from 'lucide-react';
import './FounderDashboard.css';
import { API } from '../utils/api';
import LoadingScreen from '../components/LoadingScreen';
import BackButton from '../components/BackButton';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

function Counter({ target, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [darkMode, setDarkMode] = useState(false);
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    
    if (trustUser.role !== 'founder') {
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
      const [don, evt, mem, con] = await Promise.all([
        axios.get(`${API}/api/donations`, { headers }),
        axios.get(`${API}/api/events`, { headers }),
        axios.get(`${API}/api/members`, { headers }),
        axios.get(`${API}/api/contact`, { headers }),
      ]);
      setDonations(don.data || []);
      setEvents(evt.data || []);
      setMembers(mem.data || []);
      setContacts(con.data || []);
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

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingDonations = donations.filter(d => d.payment_status === 'pending').length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const activeMembers = members.filter(m => m.status === 'active').length;

  const donationChartData = donations.length > 0 ? donations.slice(0, 7).map((d, i) => ({ name: `#${i+1}`, amount: Number(d.amount || 0) })).reverse() : [];
  const eventStatusData = [
    { name: t('upcoming'), value: upcomingEvents, color: '#2563eb' }, 
    { name: t('completed'), value: completedEvents, color: '#10b981' }
  ];
  const roleData = [
    { name: t('founder'), count: members.filter(m => m.role === 'founder').length },
    { name: t('coFounder'), count: members.filter(m => m.role && m.role.includes('co-founder')).length },
    { name: t('accountant'), count: members.filter(m => m.role === 'accountant').length },
    { name: t('media'), count: members.filter(m => m.role === 'media').length },
  ];

  const navItems = React.useMemo(() => [
    { id: 'overview', label: t('overview'), icon: Home },
    { id: 'donations', label: t('donations'), icon: Heart },
    { id: 'events', label: t('events'), icon: Calendar },
    { id: 'members', label: t('members'), icon: Users },
    { id: 'messages', label: t('messages'), icon: MessageSquare },
    { id: 'analytics', label: t('analytics'), icon: TrendingUp },
    { id: 'audit', label: t('auditLogs'), icon: Shield },
  ], [t]);

  if (loading) return <LoadingScreen fullPage={true} />;

  return (
    <div className={`fdx-root ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Overlay */}
      <div 
        className={`fdx-mobile-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Menu Button (Bottom Right) */}
      <button 
        className="fdx-mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <motion.aside className={`fdx-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        initial={{ x: -240 }} animate={{ x: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}>
        <div className="fdx-sidebar-header">
          <motion.div className="fdx-logo" whileHover={{ scale: 1.05, rotate: 5 }}>ST</motion.div>
          {sidebarOpen && <motion.span className="fdx-logo-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Sivam Trust</motion.span>}
          <button className="fdx-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="fdx-nav">
          {navItems.map((item, i) => (
            <motion.button key={item.id} className={`fdx-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}>
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="fdx-sidebar-footer">
          <button className="fdx-nav-item" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'} Mode</span>}
          </button>
          <button className="fdx-nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />{sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </motion.aside>

      <main className="fdx-main">
        <motion.header className="fdx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <BackButton darkMode={darkMode} to="/" />
            <div>
              <h1 className="fdx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p className="fdx-breadcrumb">Dashboard <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p>
            </div>
          </div>
          <div className="fdx-header-right" style={{ position: 'relative' }}>
            <LanguageSelector darkMode={darkMode} />
            <motion.div 
              className="fdx-notif-btn" 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <Bell size={20} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="fdx-notif-badge">{notifications.filter(n => !n.is_read).length}</span>
              )}
            </motion.div>

            {/* Notifications Dropdown Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="fdx-notif-dropdown"
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
            <div className="fdx-user-pill">
              <div className="fdx-user-avatar">{trustUser?.name?.charAt(0)}</div>
              <div><p className="fdx-user-name">{trustUser?.name}</p><p className="fdx-user-role">{t('founder')}</p></div>
            </div>
          </div>
        </motion.header>

        <div className="fdx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="fdx-kpi-grid">
                  {[
                    { icon: DollarSign, label: t('totalDonations'), value: totalDonations, prefix: '₹', color: 'blue', sub: `${donations.length} ${t('donations').toLowerCase()}` },
                    { icon: Users, label: t('activeMembers'), value: activeMembers, color: 'green', sub: `${members.length} total` },
                    { icon: Calendar, label: t('events'), value: events.length, color: 'purple', sub: `${upcomingEvents} ${t('upcoming').toLowerCase()}` },
                    { icon: MessageSquare, label: t('messages'), value: contacts.length, color: 'orange', sub: 'From public' },
                    { icon: Clock, label: t('pending'), value: pendingDonations, color: 'red', sub: t('donations') },
                    { icon: CheckCircle, label: t('completedEvents'), value: completedEvents, color: 'teal', sub: 'Done' },
                  ].map((kpi, i) => (
                    <motion.div key={i} className={`fdx-kpi-card ${kpi.color}`}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
                      <div className="fdx-kpi-icon"><kpi.icon size={22} /></div>
                      <div>
                        <p className="fdx-kpi-label">{kpi.label}</p>
                        <h3 className="fdx-kpi-value"><Counter target={kpi.value} prefix={kpi.prefix || ''} /></h3>
                        <p className="fdx-kpi-sub">{kpi.sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="fdx-charts-row">
                  <motion.div className="fdx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h3>Donation Trend</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={donationChartData}>
                        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `₹${v}`} />
                        <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="url(#g1)" strokeWidth={2} animationDuration={1200} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                  <motion.div className="fdx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3>Event Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={eventStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4} animationDuration={1200}>
                          {eventStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                  <motion.div className="fdx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <h3>Team by Role</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={roleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} />
                        <Tooltip /><Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} animationDuration={1200} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                <div className="fdx-bottom-row">
                  <motion.div className="fdx-list-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <div className="fdx-list-header"><h3>Recent Donations</h3><button onClick={() => setActiveTab('donations')} className="fdx-view-all">View All</button></div>
                    {donations.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <Heart size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>No donations yet</p>
                        <p style={{ fontSize: '12px' }}>Donations will appear here once received</p>
                      </div>
                    ) : (
                      donations.slice(0, 5).map((d, i) => (
                        <motion.div className="fdx-list-item" key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i*0.05 }}>
                          <div className="fdx-list-avatar">{d.donor_name?.charAt(0)}</div>
                          <div className="fdx-list-info"><p className="fdx-list-name">{d.donor_name}</p><p className="fdx-list-sub">{new Date(d.created_at).toLocaleDateString('en-IN')}</p></div>
                          <span className="fdx-amount">₹{Number(d.amount).toLocaleString()}</span>
                        </motion.div>
                      ))
                    )}
                  </motion.div>

                  <motion.div className="fdx-list-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                    <h3 style={{ marginBottom: '1rem' }}>Live Activity</h3>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No recent activity logs
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n, i) => {
                        let icon = '🔔';
                        let color = '#94a3b8';
                        if (n.type === 'donation') { icon = '💰'; color = '#10b981'; }
                        else if (n.type === 'security') { icon = '👤'; color = '#2563eb'; }
                        else if (n.type === 'event') { icon = '📅'; color = '#8b5cf6'; }
                        else if (n.type === 'message') { icon = '📩'; color = '#f59e0b'; }

                        return (
                          <motion.div className="fdx-activity-item" key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i*0.08 }}>
                            <span className="fdx-activity-dot" style={{ background: color }} />
                            <span className="fdx-activity-icon">{icon}</span>
                            <div>
                              <p className="fdx-activity-text" style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{n.title}</p>
                              <p className="fdx-activity-sub" style={{ margin: '1px 0 0', fontSize: '12px', color: '#64748b' }}>{n.message}</p>
                              <p className="fdx-activity-time" style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>
                                {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>

                  <motion.div className="fdx-list-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                    <div className="fdx-quick-actions">
                      {[
                        { icon: Calendar, label: 'Add Event', tab: 'events' },
                        { icon: Users, label: 'Members', tab: 'members' },
                        { icon: Heart, label: 'Donations', tab: 'donations' },
                        { icon: MessageSquare, label: 'Messages', tab: 'messages' },
                        { icon: TrendingUp, label: 'Analytics', tab: 'analytics' },
                        { icon: Shield, label: 'Audit Logs', tab: 'audit' },
                      ].map((q, i) => (
                        <motion.button key={i} className="fdx-quick-btn" onClick={() => setActiveTab(q.tab)}
                          whileHover={{ scale: 1.05, background: '#2563eb', color: 'white' }} whileTap={{ scale: 0.95 }}>
                          <q.icon size={18} /> {q.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === 'donations' && (
              <motion.div key="donations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="fdx-table-card">
                  <h3>All Donations</h3>
                  {donations.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <Heart size={60} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>No Donations Yet</h3>
                      <p style={{ fontSize: '14px' }}>Donation records will appear here once people start contributing</p>
                    </div>
                  ) : (
                    <table className="fdx-table">
                      <thead><tr><th>Donor</th><th>Email</th><th>Phone</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {donations.map((d, i) => (
                          <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                            <td><div className="fdx-table-user"><div className="fdx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td>
                            <td>{d.email}</td><td>{d.phone || '-'}</td>
                            <td><strong>₹{Number(d.amount).toLocaleString()}</strong></td>
                            <td>{d.transaction_id || '-'}</td>
                            <td><span className={`fdx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td>
                            <td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {events.length === 0 ? (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>
                    <Calendar size={70} style={{ opacity: 0.2, marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>No Events Yet</h3>
                    <p style={{ fontSize: '14px', marginBottom: '20px' }}>Create your first event to get started</p>
                  </div>
                ) : (
                  <div className="fdx-events-grid">
                    {events.map((e, i) => (
                      <motion.div key={e.id} className="fdx-event-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.08 }} whileHover={{ y: -4 }}>
                        <div className="fdx-event-header">
                          <span className={`fdx-status ${e.status || 'upcoming'}`}>{e.status || 'upcoming'}</span>
                          <span className="fdx-event-date">{new Date(e.event_date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <h3>{e.title}</h3><p>{e.description}</p>
                        <div className="fdx-event-footer"><span>📍 {e.location || 'TBD'}</span></div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {members.length === 0 ? (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>
                    <Users size={70} style={{ opacity: 0.2, marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>No Members Yet</h3>
                    <p style={{ fontSize: '14px' }}>Team members will appear here once added to the system</p>
                  </div>
                ) : (
                  <div className="fdx-members-grid">
                    {members.map((m, i) => (
                      <motion.div key={m.id} className="fdx-member-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i*0.08 }} whileHover={{ y: -6 }}>
                        <div className="fdx-member-avatar">{m.name?.charAt(0)}</div>
                        <h3>{m.name}</h3><p className="fdx-member-role">{m.role}</p>
                        <p>{m.email || '-'}</p><p>{m.phone || '-'}</p>
                        <p className="fdx-member-ref">{m.reference_number}</p>
                        <span className={`fdx-status ${m.status}`}>{m.status}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="fdx-table-card">
                  <h3>All Messages</h3>
                  {contacts.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <MessageSquare size={60} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#64748b' }}>No Messages Yet</h3>
                      <p style={{ fontSize: '14px' }}>Contact form submissions will appear here</p>
                    </div>
                  ) : (
                    <table className="fdx-table">
                      <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr></thead>
                      <tbody>
                        {contacts.map((c, i) => (
                          <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                            <td>{c.name}</td><td>{c.email}</td><td>{c.message}</td>
                            <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="fdx-charts-row">
                  <div className="fdx-chart-card" style={{ flex: 2 }}>
                    <h3>Donation History</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={donationChartData}>
                        <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                        <Tooltip formatter={(v) => `₹${v}`} />
                        <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="url(#g2)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="fdx-chart-card">
                    <h3>Team Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={roleData.filter(r => r.count > 0)} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="name" label>
                          {roleData.map((_, i) => <Cell key={i} fill={['#2563eb','#10b981','#f59e0b','#8b5cf6'][i]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="fdx-table-card">
                  <h3>Audit Logs — Recent Activity</h3>
                  <table className="fdx-table">
                    <thead><tr><th>Action</th><th>User</th><th>Details</th><th>Time</th></tr></thead>
                    <tbody>
                      {donations.slice(0, 5).map(d => (
                        <tr key={d.id}><td><span className="fdx-status pending">Donation</span></td><td>{d.donor_name}</td><td>₹{d.amount} received</td><td>{new Date(d.created_at).toLocaleString('en-IN')}</td></tr>
                      ))}
                      {events.map(e => (
                        <tr key={e.id}><td><span className="fdx-status active">Event</span></td><td>Admin</td><td>{e.title} — {e.status}</td><td>{new Date(e.event_date).toLocaleDateString('en-IN')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}