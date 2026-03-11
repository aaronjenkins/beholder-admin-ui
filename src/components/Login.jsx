import { useState } from 'react'
import { setItem } from '../storage.js'

const API_BASE = 'https://api.beholder.news'

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [methodId, setMethodId] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(API_BASE + '/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP')
      setMethodId(data.method_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(API_BASE + '/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method_id: methodId, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Verification failed')
      setItem('admin_token', data.token)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Beholder Admin</h1>
        <p className="login-subtitle">SMS Authentication</p>

        {error && <div className="login-error">{error}</div>}

        {!methodId ? (
          <form onSubmit={sendOtp} className="login-form">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" disabled={loading || !phone.trim()}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="login-form">
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              autoFocus
            />
            <button type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setMethodId(null); setCode(''); setError('') }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
