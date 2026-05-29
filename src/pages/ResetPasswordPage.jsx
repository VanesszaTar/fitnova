import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BASE_URL } from '../config'
import './ForgotPasswordPage.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) { setError('Password is required'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
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
            Create a new<br /><em>password.</em>
          </h2>
          <p className="fp-left-desc">
            Choose a strong password for your FitNova account.
            Make sure it meets all the requirements on the right.
          </p>
          <div className="fp-rules">
            <div className="fp-rule">At least 10 characters</div>
            <div className="fp-rule">2 uppercase letters</div>
            <div className="fp-rule">1 digit</div>
            <div className="fp-rule">1 special character</div>
          </div>
        </div>

        <div className="fp-divider"></div>

        <div className="fp-right">
          <div className="fp-card">
            <div>
              <div className="fp-card-title">Set new password</div>
              <div className="fp-card-sub">Enter and confirm your new password below.</div>
            </div>

            {success ? (
              <div className="fp-success">
                <div className="fp-success-icon">🎉</div>
                <div className="fp-success-title">Password reset successfully!</div>
                <div className="fp-success-desc">
                  Your password has been updated. You can now log in with your new password.
                </div>
                <button className="fp-btn-submit" onClick={() => navigate('/login')}>
                  Log In with New Password
                </button>
              </div>
            ) : (
              <form className="fp-form" onSubmit={handleSubmit}>
                <div className="fp-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter new password"
                    className={error ? 'input-error' : ''}
                  />
                </div>

                <div className="fp-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                    placeholder="Re-enter new password"
                    className={error ? 'input-error' : ''}
                  />
                  {error && <div className="fp-field-error">{error}</div>}
                </div>

                <button type="submit" className="fp-btn-submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage