import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Donate from './pages/Donate';
import Events from './pages/Events';
import Contact from './pages/Contact';
import Team from './pages/Team';
import AdminLogin from './pages/AdminLogin';
import FounderDashboard from './pages/FounderDashboard';
import CoFounderDashboard from './pages/CoFounderDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import MediaDashboard from './pages/MediaDashboard';
import AccessDenied from './pages/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { setupAxiosInterceptors, setupIdleTimeout, setupAbsoluteTimeout } from './utils/securityManager';
import './App.css';

function SecurityWrapper({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Setup global Axios interceptors for token auto-refresh & 401/403 redirects
    setupAxiosInterceptors(navigate);
    
    // Setup session timeouts
    const cleanupIdle = setupIdleTimeout(navigate);
    const cleanupAbsolute = setupAbsoluteTimeout(navigate);

    return () => {
      cleanupIdle();
      cleanupAbsolute();
    };
  }, [navigate]);

  return children;
}

function AdminRedirect() {
  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  if (!trustUser) return <Navigate to="/admin/login" replace />;
  if (trustUser.role === 'founder') return <Navigate to="/founder-dashboard" replace />;
  if (trustUser.role === 'co-founder-1') return <Navigate to="/cofounder1-dashboard" replace />;
  if (trustUser.role === 'co-founder-2') return <Navigate to="/cofounder2-dashboard" replace />;
  if (trustUser.role === 'accountant') return <Navigate to="/accountant-dashboard" replace />;
  if (trustUser.role === 'media') return <Navigate to="/media-dashboard" replace />;
  return <Navigate to="/access-denied" replace />;
}

function CoFounderRedirect() {
  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');
  if (!trustUser) return <Navigate to="/admin/login" replace />;
  if (trustUser.role === 'co-founder-1') return <Navigate to="/cofounder1-dashboard" replace />;
  if (trustUser.role === 'co-founder-2') return <Navigate to="/cofounder2-dashboard" replace />;
  return <Navigate to="/access-denied" replace />;
}

function App() {
  return (
    <Router>
      <SecurityWrapper>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/founder-dashboard" element={
            <ProtectedRoute allowedRoles={['founder']}>
              <FounderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cofounder1-dashboard" element={
            <ProtectedRoute allowedRoles={['co-founder-1']}>
              <CoFounderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cofounder2-dashboard" element={
            <ProtectedRoute allowedRoles={['co-founder-2']}>
              <CoFounderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/accountant-dashboard" element={
            <ProtectedRoute allowedRoles={['accountant']}>
              <AccountantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/media-dashboard" element={
            <ProtectedRoute allowedRoles={['media']}>
              <MediaDashboard />
            </ProtectedRoute>
          } />

          {/* Access Denied & Redirects */}
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/cofounder-dashboard" element={<CoFounderRedirect />} />
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/founder" element={<AdminRedirect />} />
          <Route path="/admin/cofounder" element={<AdminRedirect />} />
          <Route path="/admin/accountant" element={<AdminRedirect />} />
          <Route path="/admin/media" element={<AdminRedirect />} />

          {/* Public Routes */}
          <Route path="/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/events" element={<Events />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/team" element={<Team />} />
              </Routes>
              <Footer />
            </>
          } />
        </Routes>
      </SecurityWrapper>
    </Router>
  );
}

export default App;