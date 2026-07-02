import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, Bell, LogOut, Home, ChevronRight, CheckCircle, Clock, Menu, X, Sun, Moon, FileText, Download, Filter, CreditCard, AlertCircle } from 'lucide-react';
import './AccountantDashboard.css';

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

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !['accountant', 'founder'].includes(trustUser?.role)) { navigate('/admin/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try { const res = await axios.get(`${API}/api/donations`, { headers }); setDonations(res.data || []); }
    catch (err) { if (err.response?.status === 401) navigate('/admin/login'); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('trust_user'); navigate('/admin/login'); };

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingAmount = donations.filter(d => d.payment_status === 'pending').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const completedAmount = donations.filter(d => d.payment_status === 'completed').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingCount = donations.filter(d => d.payment_status === 'pending').length;
  const completedCount = donations.filter(d => d.payment_status === 'completed').length;
  const today = new Date().toDateString();
  const todayDonations = donations.filter(d => new Date(d.created_at).toDateString() === today);
  const todayAmount = todayDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const monthlyData = donations.reduce((acc, d) => {
    const month = new Date(d.created_at).toLocaleString('en-IN', { month: 'short' });
    const existing = acc.find(a => a.month === month);
    if (existing) existing.amount += Number(d.amount); else acc.push({ month, amount: Number(d.amount) });
    return acc;
  }, []);
  const statusData = [{ name: 'Pending', value: pendingCount, color: '#f59e0b' }, { name: 'Completed', value: completedCount, color: '#10b981' }];
  const filteredDonations = filterStatus === 'all' ? donations : donations.filter(d => (d.payment_status || 'pending') === filterStatus);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'donations', label: 'Donations', icon: DollarSign },
    { id: 'payments', label: 'Payment History', icon: CreditCard },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  if (loading) return (
    <div className={`acx-loading ${darkMode ? 'dark' : ''}`}>
      <motion.div className="acx-logo-reveal" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: 'spring' }}>ST</motion.div>
      <div className="acx-skeleton-rows">{[1, 2, 3].map(i => <div key={i} className="acx-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>
    </div>
  );

  return (
    <div className={`acx-root ${darkMode ? 'dark' : ''}`}>
      <motion.aside className={`acx-sidebar ${sidebarOpen ? 'open' : 'closed'}`} initial={{ x: -240 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
        <div className="acx-sidebar-header">
          <div className="acx-logo">ST</div>{sidebarOpen && <span className="acx-logo-text">Sivam Trust</span>}
          <button className="acx-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {sidebarOpen && (<div className="acx-user-info"><div className="acx-user-avatar">{trustUser?.name?.charAt(0)}</div><div><p className="acx-user-name">{trustUser?.name}</p><p className="acx-user-role">Accountant</p></div></div>)}
        <nav className="acx-nav">
          {navItems.map((item, i) => (
            <motion.button key={item.id} className={`acx-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }}>
              <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>
        <div className="acx-sidebar-footer">
          <button className="acx-nav-item" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}{sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'} Mode</span>}</button>
          <button className="acx-nav-item logout" onClick={handleLogout}><LogOut size={20} />{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </motion.aside>

      <main className="acx-main">
        <motion.header className="acx-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div><h1 className="acx-page-title">{navItems.find(n => n.id === activeTab)?.label}</h1><p className="acx-breadcrumb">Accountant <ChevronRight size={14} /> {navItems.find(n => n.id === activeTab)?.label}</p></div>
          <div className="acx-header-right"><div className="acx-notif-btn"><Bell size={20} /></div><span className="acx-role-badge">Accountant</span></div>
        </motion.header>

        <div className="acx-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="acx-stats-grid">
                  {[
                    { icon: DollarSign, label: 'Total Collections', value: totalAmount, prefix: '₹', color: 'blue', sub: `${donations.length} donations` },
                    { icon: CheckCircle, label: 'Completed', value: completedAmount, prefix: '₹', color: 'green', sub: `${completedCount} payments` },
                    { icon: Clock, label: 'Pending', value: pendingAmount, prefix: '₹', color: 'amber', sub: `${pendingCount} pending` },
                    { icon: TrendingUp, label: "Today's Income", value: todayAmount, prefix: '₹', color: 'purple', sub: `${todayDonations.length} today` },
                  ].map((kpi, i) => (
                    <motion.div key={i} className={`acx-stat-card ${kpi.color}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                      <div className="acx-stat-icon"><kpi.icon size={22} /></div>
                      <div><p className="acx-stat-label">{kpi.label}</p><h3 className="acx-stat-value"><Counter target={kpi.value} prefix={kpi.prefix || ''} /></h3><p className="acx-stat-sub">{kpi.sub}</p></div>
                    </motion.div>
                  ))}
                </div>
                <div className="acx-charts-row">
                  <motion.div className="acx-chart-card" style={{ flex: 2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h3>Monthly Donation Trend</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `₹${v}`} /><Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} animationDuration={1200} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                  <motion.div className="acx-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3>Payment Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4} animationDuration={1200}>
                          {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie><Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>
                <div className="acx-summary-row">
                  {[
                    { label: 'Daily Income', value: todayAmount, sub: 'Today' },
                    { label: 'Monthly Income', value: totalAmount, sub: 'This period' },
                    { label: 'Pending Payments', value: pendingAmount, sub: `${pendingCount} transactions`, pending: true },
                    { label: 'Avg Donation', value: donations.length ? Math.round(totalAmount / donations.length) : 0, sub: 'Per donor' },
                  ].map((s, i) => (
                    <motion.div key={i} className="acx-summary-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
                      <h4>{s.label}</h4><p className={`acx-summary-amount ${s.pending ? 'pending' : ''}`}>₹<Counter target={s.value} /></p><p className="acx-summary-sub">{s.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'donations' && (
              <motion.div key="donations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="acx-filter-bar">
                  <div className="acx-filter-group"><Filter size={16} /><select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="acx-filter-select"><option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option></select></div>
                  <span className="acx-result-count">{filteredDonations.length} records</span>
                </div>
                <div className="acx-table-card">
                  <table className="acx-table">
                    <thead><tr><th>Donor</th><th>Email</th><th>Phone</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>{filteredDonations.map(d => (
                      <tr key={d.id}><td><div className="acx-table-user"><div className="acx-mini-avatar">{d.donor_name?.charAt(0)}</div>{d.donor_name}</div></td><td>{d.email}</td><td>{d.phone || '-'}</td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td>{d.transaction_id || '-'}</td><td><span className={`acx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="acx-table-card">
                  <h3>Payment History</h3>
                  <table className="acx-table">
                    <thead><tr><th>#</th><th>Donor</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>{donations.map((d, i) => (<tr key={d.id}><td>{i+1}</td><td>{d.donor_name}</td><td><strong>₹{Number(d.amount).toLocaleString()}</strong></td><td>{d.transaction_id || 'N/A'}</td><td><span className={`acx-status ${d.payment_status || 'pending'}`}>{d.payment_status || 'pending'}</span></td><td>{new Date(d.created_at).toLocaleDateString('en-IN')}</td></tr>))}</tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="acx-report-header"><h3>Financial Summary Report</h3><button className="acx-export-btn" onClick={() => window.print()}><Download size={16} /> Export / Print</button></div>
                <div className="acx-report-grid">
                  {[
                    { label: 'Total Donations Received', value: totalAmount, sub: `${donations.length} transactions`, c: 'blue' },
                    { label: 'Completed Payments', value: completedAmount, sub: `${completedCount} transactions`, c: 'green' },
                    { label: 'Pending Payments', value: pendingAmount, sub: `${pendingCount} transactions`, c: 'amber' },
                    { label: 'Average Donation', value: donations.length ? Math.round(totalAmount / donations.length) : 0, sub: 'Per donor', c: 'purple' },
                    { label: "Today's Collection", value: todayAmount, sub: `${todayDonations.length} today`, c: 'teal' },
                  ].map((r, i) => (
                    <motion.div key={i} className={`acx-report-card ${r.c}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <p>{r.label}</p><h2>₹<Counter target={r.value} /></h2><span>{r.sub}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="acx-charts-row">
                <div className="acx-chart-card" style={{ flex: 2 }}>
                  <h3>Donation Amounts</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={donations.slice(0, 8).map(d => ({ name: d.donor_name?.split(' ')[0], amount: Number(d.amount) }))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis /><Tooltip formatter={(v) => `₹${v}`} />
                      <Bar dataKey="amount" fill="#2563eb" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="acx-chart-card">
                  <h3>Payment Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart><Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>{statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}