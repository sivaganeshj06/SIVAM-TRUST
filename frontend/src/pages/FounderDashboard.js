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

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || trustUser?.role !== 'founder') { navigate('/access-denied'); return; }
    fetchAll();
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
      if (err.response?.status === 401) navigate('/admin/login'); 
      else if (err.response?.status === 403) navigate('/access-denied');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('trust_user');
    navigate('/admin/login');
  };

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingDonations = donations.filter(d => d.payment_status === 'pending').length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const activeMembers = members.filter(m => m.status === 'active').length;

  const donationChartData = donations.slice(0, 7).map((d, i) => ({ name: `#${i+1}`, amount: Number(d.amount) })).reverse();
  const eventStatusData = [{ name: 'Upcoming', value: upcomingEvents, color: '#2563eb' }, { name: 'Completed', value: completedEvents, color: '#10b981' }];
  const roleData = [
    { name: 'Founder', count: members.filter(m => m.role === 'founder').length },
    { name: 'Co-Founder', count: members.filter(m => m.role === 'co-founder').length },
    { name: 'Accountant', count: members.filter(m => m.role === 'accountant').length },
    { name: 'Media', count: members.filter(m => m.role === 'media').length },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'donations', label: 'Donations', icon: Heart },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
  ];

  if (loading) return (
    <div className={`fdx-loading ${darkMode ? 'dark' : ''}`}>
      <motion.div className="fdx-logo-reveal" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: 'spring' }}>ST</motion.div>
      <div className="fdx-skeleton-rows">
        {[1,2,3].map(i => <div key={i} className="fdx-skeleton-row" style={{ animationDelay: `${i*0.1}s` }} />)}
      </div>
    </div>
  );

  return (
    <div className={`fdx-root ${darkMode ? 'dark' : ''}`}>
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
            <LogOut size={20} />{sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className="fdx-main">
        <motion.header className="fdx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div>
            <h1 className="fdx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1>
            <p className="fdx-breadcrumb">Dashboard <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p>
          </div>
          <div className="fdx-header-right">
            <motion.div className="fdx-notif-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Bell size={20} />
              <span className="fdx-notif-badge">3</span>
            </motion.div>
            <div className="fdx-user-pill">
              <div className="fdx-user-avatar">{trustUser?.name?.charAt(0)}</div>
              <div><p className="fdx-user-name">{trustUser?.name}</p><p className="fdx-user-role">Founder</p></div>
            </div>
          </div>
        </motion.header>

        <div className="fdx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="fdx-kpi-grid">
                  {[
                    { icon: DollarSign, label: 'Total Donations', value: totalDonations, prefix: '₹', color: 'blue', sub: `${donations.length} donors` },
                    { icon: Users, label: 'Active Members', value: activeMembers, color: 'green', sub: `${members.length} total` },
                    { icon: Calendar, label: 'Events', value: events.length, color: 'purple', sub: `${upcomingEvents} upcoming` },
                    { icon: MessageSquare, label: 'Messages', value: contacts.length, color: 'orange', sub: 'From public' },
                    { icon: Clock, label: 'Pending', value: pendingDonations, color: 'red', sub: 'Donations' },
                    { icon: CheckCircle, label: 'Completed Events', value: completedEvents, color: 'teal', sub: 'Done' },
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
                    {donations.slice(0, 5).map((d, i) => (
                      <motion.div className="fdx-list-item" key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i*0.05 }}>
                        <div className="fdx-list-avatar">{d.donor_name?.charAt(0)}</div>
                        <div className="fdx-list-info"><p className="fdx-list-name">{d.donor_name}</p><p className="fdx-list-sub">{new Date(d.created_at).toLocaleDateString('en-IN')}</p></div>
                        <span className="fdx-amount">₹{Number(d.amount).toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div className="fdx-list-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                    <h3 style={{ marginBottom: '1rem' }}>Live Activity</h3>
                    {[
                      { icon: '💰', text: 'New donation received', time: '2 min ago', color: '#10b981' },
                      { icon: '👤', text: 'Co-Founder logged in', time: '15 min ago', color: '#2563eb' },
                      { icon: '📅', text: 'Event status updated', time: '1 hr ago', color: '#f59e0b' },
                    ].map((a, i) => (
                      <motion.div className="fdx-activity-item" key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i*0.08 }}>
                        <span className="fdx-activity-dot" style={{ background: a.color }} />
                        <span className="fdx-activity-icon">{a.icon}</span>
                        <div><p className="fdx-activity-text">{a.text}</p><p className="fdx-activity-time">{a.time}</p></div>
                      </motion.div>
                    ))}
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
                </div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="fdx-table-card">
                  <h3>All Messages</h3>
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