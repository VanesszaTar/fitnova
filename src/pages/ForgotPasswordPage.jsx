import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../config'
import './ForgotPasswordPage.css'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Could not connect to server')
    }
    setLoading(false)
  }

  return (
    <div className="forgot-page">
      <div className="blob blob-fp1"></div>
      <div className="blob blob-fp2"></div>

      <nav className="fp-nav">
        <button className="fp-btn-back" onClick={() => navigate('/login')}>← Back</button>
        <div className="fp-nav-logo">
          <div className="fp-logo-icon">
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="1" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="15" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="4.5" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
              <rect x="13" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
              <rect x="7" y="9" width="6" height="2.5" rx="1.2" fill="white" opacity="0.75"/>
            </svg>
          </div>
          <span className="fp-logo-name">FitNova</span>
        </div>
      </nav>

      <div className="fp-main">
        <div className="fp-left">
          <div className="fp-left-label">Password Recovery</div>
          <h2 className="fp-left-title">
            Forgot your<br /><em>password?</em>
          </h2>
          <p className="fp-left-desc">
            No worries — enter your email address and we'll
            send you a secure link to reset your password.
            The link expires in 15 minutes.
          </p>
        </div>

        <div className="fp-divider"></div>

        <div className="fp-right">
          <div className="fp-card">
            <div>
              <div className="fp-card-title">Reset your password</div>
              <div className="fp-card-sub">Enter the email associated with your account.</div>
            </div>

            {success ? (
              <div className="fp-success">
                <div className="fp-success-icon">✉️</div>
                <div className="fp-success-title">Check your inbox!</div>
                <div className="fp-success-desc">
                  If that email is registered, a reset link has been sent.
                  Follow the instructions in the email to reset your password.
                </div>
                <button className="fp-btn-submit" onClick={() => navigate('/login')}>
                  Back to Login
                </button>
              </div>
            ) : (
              <form className="fp-form" onSubmit={handleSubmit}>
                <div className="fp-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="e.g. alex@example.com"
                    className={error ? 'input-error' : ''}
                  />
                  {error && <div className="fp-field-error">{error}</div>}
                </div>

                <button type="submit" className="fp-btn-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="fp-back-row">
                  <span className="fp-back-hint">Remembered your password?</span>
                  <button type="button" className="fp-back-link" onClick={() => navigate('/login')}>
                    Log in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage