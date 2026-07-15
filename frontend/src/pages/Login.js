import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/LOGO.png';
import { API } from '../utils/api';
import './Login.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      setTimeout(() => navigate('/admin', { replace: true }), 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password!');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img src={logo} alt="Sivam Trust Logo" className="login-logo" />
        <h2>Admin Login</h2>
        <p>Sivam Trust Foundation</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-btn">
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;