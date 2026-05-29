import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifySecurityAnswer, setToken } from '../services/api'
import { saveLastLogin, incrementLoginCount, saveSession } from '../utils/cookies'
import './ForgotPasswordPage.css'
import './SecurityQuestionPage.css'

function SecurityQuestionPage({ setCurrentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const tempToken = location.state?.tempToken
  const securityQuestion = location.state?.securityQuestion

  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tempToken || !securityQuestion) navigate('/login')
  }, [tempToken, securityQuestion])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!answer.trim()) { setError('Answer is required'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifySecurityAnswer(tempToken, answer)
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
      setError(err.message || 'Incorrect answer')
      setAnswer('')
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
          <div className="fp-left-label">Step 3 of 3 — Security</div>
          <h2 className="fp-left-title">
            One last<br /><em>step.</em>
          </h2>
          <p className="fp-left-desc">
            Answer your personal security question to complete
            the login process. This helps us verify it's really you.
          </p>
          <div className="fp-rules">
            <div className="fp-rule">Your answer is case insensitive</div>
            <div className="fp-rule">Answer exactly as you did during registration</div>
            <div className="fp-rule">This is the last step before you're in</div>
          </div>
        </div>

        <div className="fp-divider"></div>

        <div className="fp-right">
          <div className="fp-card">
            <div>
              <div className="fp-card-title">Security question</div>
              <div className="fp-card-sub">Answer the question you set during registration.</div>
            </div>

            <div className="sq-question-box">
              <span className="sq-question-icon">🔐</span>
              <span className="sq-question-text">{securityQuestion}</span>
            </div>

            <form className="fp-form" onSubmit={handleSubmit}>
              <div className="fp-field">
                <label>Your Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); setError('') }}
                  placeholder="Enter your answer..."
                  className={error ? 'input-error' : ''}
                  autoFocus
                />
                {error && <div className="fp-field-error">{error}</div>}
              </div>

              <button type="submit" className="fp-btn-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Complete Login'}
              </button>

              <div className="fp-back-row">
                <span className="fp-back-hint">Wrong account?</span>
                <button type="button" className="fp-back-link" onClick={() => navigate('/login')}>
                  Start over
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityQuestionPage