import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, LayoutDashboard } from 'lucide-react';
import './AccessDenied.css';

export default function AccessDenied() {
  const navigate = useNavigate();
  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');

  const handleRedirect = () => {
    if (!trustUser) {
      navigate('/admin/login');
      return;
    }
    // Redirect to their own dashboard
    if (trustUser.role === 'founder') navigate('/founder-dashboard');
    else if (trustUser.role === 'co-founder-1') navigate('/cofounder1-dashboard');
    else if (trustUser.role === 'co-founder-2') navigate('/cofounder2-dashboard');
    else if (trustUser.role === 'accountant') navigate('/accountant-dashboard');
    else if (trustUser.role === 'media') navigate('/media-dashboard');
    else navigate('/admin/login');
  };

  return (
    <div className="denied-container">
      <div className="denied-card">
        <div className="denied-icon-container">
          <ShieldAlert className="denied-icon" size={64} />
        </div>
        <h1 className="denied-title">403</h1>
        <h2 className="denied-subtitle">Access Denied</h2>
        <p className="denied-text">
          You do not have permission to view this page. This resource is protected under strict Role-Based Access Control (RBAC).
        </p>
        <button className="denied-btn" onClick={handleRedirect}>
          {trustUser ? (
            <>
              <LayoutDashboard size={18} /> Go to My Dashboard
            </>
          ) : (
            <>
              <LogIn size={18} /> Return to Login
            </>
          )}
        </button>
      </div>
    </div>
  );
}
