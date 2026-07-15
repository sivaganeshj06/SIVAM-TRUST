import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import logo from '../assets/LOGO.png'
import { API } from '../utils/api';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate()
  const [refNo, setRefNo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        reference_number: refNo,
        password: password
      })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('trust_user', JSON.stringify(user))
      
      // Fast redirect based on role with minimal delay (200ms)
      setTimeout(() => {
        if (user.role === 'founder') navigate('/founder-dashboard', { replace: true })
        else if (user.role === 'co-founder-1' || user.role === 'co-founder-2') navigate('/cofounder-dashboard', { replace: true })
        else if (user.role === 'accountant') navigate('/accountant-dashboard', { replace: true })
        else if (user.role === 'media') navigate('/media-dashboard', { replace: true })
        else navigate('/access-denied', { replace: true })
      }, 200)
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a5f 100%)',
      padding: '1rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>

        {/* BRANDING */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
            <div style={{
              position: 'absolute', inset: '-8px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)',
            }} />
            <img src={logo} alt="Sivam Trust Foundation" style={{
              width: '80px', height: '80px', borderRadius: '50%',
              objectFit: 'cover', border: '3px solid #2563eb',
              boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
              position: 'relative', zIndex: 1,
            }} />
          </div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800',
            color: '#0f172a', margin: '0 0 6px',
            letterSpacing: '-0.3px',
          }}>
            Sivam Trust Foundation
          </h1>
          <p style={{
            fontSize: '13px', color: '#2563eb',
            fontWeight: '600', margin: '0 0 4px',
            letterSpacing: '0.5px',
          }}>
            Enterprise Admin Portal
          </p>
          <p style={{
            fontSize: '12px', color: '#94a3b8',
            margin: 0, fontStyle: 'italic',
          }}>
            Helping the Poor • Serving with Love
          </p>
          <div style={{
            width: '40px', height: '3px',
            background: 'linear-gradient(90deg, #2563eb, #10b981)',
            borderRadius: '10px', margin: '12px auto 0',
          }} />
        </div>

        {/* LOGIN FORM */}
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '1.5rem', textAlign: 'center' }}>
          Sign in with your reference number
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reference Number
            </label>
            <input
              type="text"
              placeholder="STF/2026/FOU"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 14px',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                fontSize: '14px', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
                background: '#f8fafc', color: '#0f172a',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 42px 12px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: '12px',
                  fontSize: '14px', boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit',
                  background: '#f8fafc', color: '#0f172a',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  outline: 'none'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              color: '#dc2626', fontSize: '13px', marginBottom: '1rem',
              background: '#fef2f2', padding: '10px 14px',
              borderRadius: '10px', border: '1px solid #fecaca',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* FOOTER */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#065f46', padding: '3px 10px', borderRadius: '100px', fontWeight: '600' }}>🔒 Secure</span>
            <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '100px', fontWeight: '600' }}>✅ Verified</span>
            <span style={{ fontSize: '11px', background: '#faf5ff', color: '#5b21b6', padding: '3px 10px', borderRadius: '100px', fontWeight: '600' }}>💙 Official</span>
          </div>
          <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '12px' }}>
            © 2026 Sivam Trust Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}