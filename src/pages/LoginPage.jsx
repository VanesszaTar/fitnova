import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateLogin } from '../data/users'
import { loginUser, setToken } from '../services/api'
import { saveLastLogin, incrementLoginCount, saveSession, getSession } from '../utils/cookies'
import './LoginPage.css'

function LoginPage({ setCurrentUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedEmail = getSession()
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
    }
  }, [])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setLoginError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateLogin(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setFormData(prev => {
        const cleared = { ...prev }
        Object.keys(validationErrors).forEach(field => { cleared[field] = '' })
        return cleared
      })
      return
    }

    setLoading(true)
    try {
      const result = await loginUser(formData.email, formData.password)

      // ── 3-way auth flow ──────────────────────────────────────────────────
      // If the user has a security question set up, go through 3 steps
      if (result.requiresTwoFactor) {
        // Redirect to the 2FA page, passing userId in state
        navigate('/two-factor', { state: { userId: result.userId } })
        return
      }

      // ── Direct login (users without security question) ───────────────────
      setToken(result.token)
      saveLastLogin()
      incrementLoginCount()
      saveSession(result.user.email)
      setCurrentUser(result.user)

      if (result.user.role?.name === 'admin') {
        navigate('/admin')
      } else {
        navigate('/plans')
      }
    } catch (err) {
      const message = err.message.toLowerCase()
      if (message.includes('email') || message.includes('user') || message.includes('account')) {
        setErrors({ email: 'No account found with this email' })
        setFormData({ email: '', password: '' })
      } else {
        setErrors({ password: 'Incorrect password' })
        setFormData(prev => ({ ...prev, password: '' }))
      }
      setLoginError('')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="blob blob-l1"></div>
      <div className="blob blob-l2"></div>

      <nav className="login-nav">
        <div className="login-nav-left">
          <button className="login-btn-back" onClick={() => navigate('/')}>← Back</button>
          <div className="login-nav-logo">
            <div className="login-logo-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="1" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="15" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="4.5" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
                <rect x="13" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
                <rect x="7" y="9" width="6" height="2.5" rx="1.2" fill="white" opacity="0.75"/>
              </svg>
            </div>
            <span className="login-logo-name">FitNova</span>
          </div>
        </div>
        <div className="login-nav-right">
          <span className="login-nav-hint">Don't have an account?</span>
          <button className="login-btn-register" onClick={() => navigate('/register')}>Sign Up</button>
        </div>
      </nav>

      <div className="login-main">
        <div className="login-left">
          <div className="login-left-label">WELCOME BACK</div>
          <h2 className="login-left-title">
            Good to see<br />you <em>again.</em>
          </h2>
          <p className="login-left-desc">
            Log in to pick up where you left off — your workouts,
            nutrition logs and goals are waiting for you.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-num">2,400+</div>
              <div className="login-stat-lbl">Active users</div>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <div className="login-stat-num">48k+</div>
              <div className="login-stat-lbl">Sessions logged</div>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <div className="login-stat-num">12k+</div>
              <div className="login-stat-lbl">Goals achieved</div>
            </div>
          </div>
        </div>

        <div className="login-divider"></div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-title">Log in to FitNova</div>
              <div className="login-card-sub">Enter your credentials to access your account.</div>
            </div>

            {loginError && (
              <div className="login-error-banner">
                <div className="login-error-icon">✕</div>
                <div>
                  <div className="login-error-title">Invalid credentials</div>
                  <div className="login-error-sub">{loginError}</div>
                </div>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label>EMAIL ADDRESS</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. alex@example.com"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <div className="login-field-error">{errors.email}</div>}
              </div>

              <div className="login-field">
                <div className="login-field-top">
                  <label>PASSWORD</label>
                  <button type="button" className="login-forgot" onClick={() => navigate('/forgot-password')}>
                    Forgot password?
                  </button>
                </div>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'input-error' : ''}
                />
                {errors.password && <div className="login-field-error">{errors.password}</div>}
              </div>

              <button type="submit" className="login-btn-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Log In'}
              </button>

              <div className="login-or">
                <div className="login-or-line"></div>
                <span>or</span>
                <div className="login-or-line"></div>
              </div>

              <div className="login-retry-note">
                Authentication failed? Double-check your credentials
                and try again — your account remains accessible.
              </div>
            </form>

            <div className="login-register-row">
              <span className="login-register-hint">Don't have an account?</span>
              <button className="login-register-link" onClick={() => navigate('/register')}>
                Create one for free
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage