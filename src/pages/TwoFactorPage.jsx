import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyTwoFactorCode, sendTwoFactorCode } from '../services/api'
import './ForgotPasswordPage.css'
import './TwoFactorPage.css'

function TwoFactorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const userId = location.state?.userId

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [countdown, setCountdown] = useState(300)
  const inputs = useRef([])

  useEffect(() => {
    if (!userId) { navigate('/login'); return }
    // Send the code as soon as we land on this page
    sendTwoFactorCode(userId).catch(() => {})
  }, [userId])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleDigit(index, value) {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')
    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pasted.split('').forEach((digit, i) => { newCode[i] = digit })
    setCode(newCode)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) { setError('Please enter all 6 digits'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifyTwoFactorCode(userId, fullCode)
      navigate('/security-question', {
        state: {
          tempToken: result.tempToken,
          securityQuestion: result.securityQuestion
        }
      })
    } catch (err) {
      setError(err.message || 'Invalid code')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
    setLoading(false)
  }

  async function handleResend() {
    setResending(true)
    setResendSuccess(false)
    setError('')
    try {
      await sendTwoFactorCode(userId)
      setResendSuccess(true)
      setCountdown(300)
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch {
      setError('Failed to resend code')
    }
    setResending(false)
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
          <div className="fp-left-label">Step 2 of 3 — Verification</div>
          <h2 className="fp-left-title">
            Check your<br /><em>email.</em>
          </h2>
          <p className="fp-left-desc">
            We sent a 6-digit verification code to your email address.
            Enter it below to continue. The code expires in 5 minutes.
          </p>
          <div className="fp-rules">
            <div className="fp-rule">Check your spam folder if you don't see it</div>
            <div className="fp-rule">The code is valid for 5 minutes only</div>
            <div className="fp-rule">Each code can only be used once</div>
          </div>
        </div>

        <div className="fp-divider"></div>

        <div className="fp-right">
          <div className="fp-card">
            <div>
              <div className="fp-card-title">Enter verification code</div>
              <div className="fp-card-sub">
                Type the 6-digit code sent to your email.
                {countdown > 0
                  ? ` Expires in ${formatCountdown(countdown)}.`
                  : ' Code expired — please resend.'}
              </div>
            </div>

            <form className="fp-form" onSubmit={handleSubmit}>
              <div className="tfa-code-inputs">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`tfa-digit${error ? ' input-error' : ''}`}
                  />
                ))}
              </div>

              {error && <div className="tfa-error">{error}</div>}
              {resendSuccess && <div className="tfa-resend-success">✅ New code sent to your email!</div>}
              {countdown === 0 && <div className="tfa-expired">Code expired — click Resend to get a new one.</div>}

              <button
                type="submit"
                className="fp-btn-submit"
                disabled={loading || countdown === 0}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="fp-back-row">
                <span className="fp-back-hint">Didn't receive the code?</span>
                <button
                  type="button"
                  className="fp-back-link"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorPage