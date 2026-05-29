import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateRegister } from '../data/users'
import { registerUser, setToken } from '../services/api'
import './RegisterPage.css'

const SECURITY_QUESTIONS = [
  'What day of the month was your mother born? (e.g. 24)',
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your elementary school?',
  'What is your oldest sibling\'s middle name?'
]

function RegisterPage({ setCurrentUser }) {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: ''
  })

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateRegister(formData)

    // Validate security question and answer
    if (!formData.securityQuestion) {
      validationErrors.securityQuestion = 'Please select a security question'
    }
    if (!formData.securityAnswer || formData.securityAnswer.trim() === '') {
      validationErrors.securityAnswer = 'Security answer is required'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setFormData(prev => {
        const cleared = { ...prev }
        Object.keys(validationErrors).forEach(field => {
          cleared[field] = ''
        })
        return cleared
      })
      return
    }

    try {
      const result = await registerUser({
        ...formData,
        age: parseInt(formData.age)
      })
      setToken(result.token)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setErrors({ email: err.message })
      setFormData(prev => ({ ...prev, email: '' }))
    }
  }

  return (
    <div className="register-page">
      <div className="blob blob-r1"></div>
      <div className="blob blob-r2"></div>

      <nav className="reg-nav">
        <div className="reg-nav-left">
          <button className="reg-btn-back" onClick={() => navigate('/')}>← Back</button>
          <div className="reg-nav-logo">
            <div className="reg-logo-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="1" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="15" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="4.5" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
                <rect x="13" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
                <rect x="7" y="9" width="6" height="2.5" rx="1.2" fill="white" opacity="0.75"/>
              </svg>
            </div>
            <span className="reg-logo-name">FitNova</span>
          </div>
        </div>
        <div className="reg-nav-right">
          <span className="reg-nav-hint">Already have an account?</span>
          <button className="reg-btn-login" onClick={() => navigate('/login')}>Log In</button>
        </div>
      </nav>

      <div className="reg-main">
        <div className="reg-left">
          <div className="reg-left-label">GET STARTED TODAY</div>
          <h2 className="reg-left-title">
            Your journey<br />starts <em>here.</em>
          </h2>
          <p className="reg-left-desc">
            Join FitNova and take control of your training,
            nutrition, and goals — all in one place.
          </p>
          <div className="reg-features">
            <div className="reg-feature">
              <div className="reg-feature-icon" style={{ background: 'rgba(224,96,126,0.15)' }}>🏋️</div>
              <div>
                <div className="reg-feature-name">Custom Workout Plans</div>
                <div className="reg-feature-sub">Build and track your training sessions</div>
              </div>
            </div>
            <div className="reg-feature">
              <div className="reg-feature-icon" style={{ background: 'rgba(194,113,79,0.15)' }}>🥗</div>
              <div>
                <div className="reg-feature-name">Nutrition Logging</div>
                <div className="reg-feature-sub">Track meals, macros and calorie balance</div>
              </div>
            </div>
            <div className="reg-feature">
              <div className="reg-feature-icon" style={{ background: 'rgba(219,211,173,0.12)' }}>🎯</div>
              <div>
                <div className="reg-feature-name">Goal Monitoring</div>
                <div className="reg-feature-sub">Set targets and watch your progress grow</div>
              </div>
            </div>
            <div className="reg-feature">
              <div className="reg-feature-icon" style={{ background: 'rgba(246,197,175,0.12)' }}>📊</div>
              <div>
                <div className="reg-feature-name">Reports & Insights</div>
                <div className="reg-feature-sub">Weekly and monthly performance stats</div>
              </div>
            </div>
          </div>
        </div>

        <div className="reg-divider"></div>

        <div className="reg-right">
          <div className="reg-card">
            <div className="reg-card-header">
              <div className="reg-card-title">Create your account</div>
              <div className="reg-card-sub">All fields are required</div>
            </div>

            {success && (
              <div className="reg-success">
                ✓ Account created! Redirecting to login...
              </div>
            )}

            <form className="reg-form" onSubmit={handleSubmit} noValidate>

              <div className="reg-row-2">
                <div className="reg-field">
                  <label>FIRST NAME</label>
                  <div className="reg-hint">No spaces allowed</div>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Alex"
                    className={errors.firstName ? 'input-error' : ''}
                  />
                  {errors.firstName && <div className="reg-error">{errors.firstName}</div>}
                </div>
                <div className="reg-field">
                  <label>LAST NAME</label>
                  <div className="reg-hint">No spaces allowed</div>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Smith"
                    className={errors.lastName ? 'input-error' : ''}
                  />
                  {errors.lastName && <div className="reg-error">{errors.lastName}</div>}
                </div>
              </div>

              <div className="reg-row-2">
                <div className="reg-field">
                  <label>AGE</label>
                  <div className="reg-hint">Must be 14 or older</div>
                  <input
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 22"
                    className={errors.age ? 'input-error' : ''}
                  />
                  {errors.age && <div className="reg-error">{errors.age}</div>}
                </div>
                <div className="reg-field">
                  <label>GENDER</label>
                  <div className="reg-hint">Select one</div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? 'input-error' : ''}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && <div className="reg-error">{errors.gender}</div>}
                </div>
              </div>

              <div className="reg-field">
                <label>EMAIL ADDRESS</label>
                <div className="reg-hint">Must contain @ and end with .com · Must be unique</div>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. alex@example.com"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <div className="reg-error">{errors.email}</div>}
              </div>

              <div className="reg-field">
                <label>PASSWORD</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={errors.password ? 'input-error' : ''}
                />
                <div className="reg-password-rules">
                  <span>10+ characters</span>
                  <span>2 uppercase letters</span>
                  <span>1 digit</span>
                  <span>1 special character</span>
                </div>
                {errors.password && <div className="reg-error">{errors.password}</div>}
              </div>

              <div className="reg-field">
                <label>CONFIRM PASSWORD</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && <div className="reg-error">{errors.confirmPassword}</div>}
              </div>

              {/* ── Security Question ──────────────────────────────────── */}
              <div className="reg-security-section">
                <div className="reg-security-label">🔐 SECURITY QUESTION</div>
                <div className="reg-hint">Used to verify your identity during login</div>
              </div>

              <div className="reg-field">
                <label>SELECT A QUESTION</label>
                <select
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  className={errors.securityQuestion ? 'input-error' : ''}
                >
                  <option value="">Choose a security question...</option>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
                {errors.securityQuestion && <div className="reg-error">{errors.securityQuestion}</div>}
              </div>

              <div className="reg-field">
                <label>YOUR ANSWER</label>
                <div className="reg-hint">Remember this — you'll need it every time you log in</div>
                <input
                  name="securityAnswer"
                  type="text"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  placeholder="Enter your answer..."
                  className={errors.securityAnswer ? 'input-error' : ''}
                />
                {errors.securityAnswer && <div className="reg-error">{errors.securityAnswer}</div>}
              </div>

              <button type="submit" className="reg-btn-submit">
                Create Account
              </button>

              <div className="reg-terms">
                By creating an account you agree to our{' '}
                <span>Terms of Service</span> and <span>Privacy Policy</span>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage