import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const trustUser = JSON.parse(localStorage.getItem('trust_user') || 'null');

  if (!token || !trustUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!allowedRoles.includes(trustUser.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
