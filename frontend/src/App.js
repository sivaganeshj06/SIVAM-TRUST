import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Donate from './pages/Donate';
import Events from './pages/Events';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Team from './pages/Team';
import AdminLogin from './pages/AdminLogin';
import FounderDashboard from './pages/FounderDashboard';
import CoFounderDashboard from './pages/CoFounderDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import MediaDashboard from './pages/MediaDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/founder-dashboard" element={<FounderDashboard />} />
        <Route path="/cofounder-dashboard" element={<CoFounderDashboard />} />
        <Route path="/accountant-dashboard" element={<AccountantDashboard />} />
        <Route path="/media-dashboard" element={<MediaDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/founder" element={<Admin />} />
        <Route path="/admin/cofounder" element={<Admin />} />
        <Route path="/admin/accountant" element={<Admin />} />
        <Route path="/admin/media" element={<Admin />} />
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
    </Router>
  );
}

export default App;