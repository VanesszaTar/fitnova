import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isFirstVisit, markVisited } from '../utils/cookies'
import './PresentationPage.css'

function PresentationPage() {
  const navigate = useNavigate()
  const [showCookieBanner, setShowCookieBanner] = useState(isFirstVisit())

  function acceptCookies() {
    markVisited()
    setShowCookieBanner(false)
  }

  return (
    <div className="presentation">

      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <nav className="pres-nav">
        <div className="pres-nav-logo">
          <div className="pres-logo-icon">
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="1" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="15" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="4.5" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
              <rect x="13" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
              <rect x="7" y="9" width="6" height="2.5" rx="1.2" fill="white" opacity="0.75"/>
            </svg>
          </div>
          <span className="pres-logo-name">FitNova</span>
        </div>
        <div className="pres-nav-right">
          <span className="pres-nav-hint">Already have an account?</span>
          <button className="pres-btn-login" onClick={() => navigate('/login')}>
            Log In
          </button>
        </div>
      </nav>

      <div className="pres-hero">

        <div className="pres-left">
          <div className="pres-badge">
            <div className="pres-badge-dot"></div>
            <span>YOUR FITNESS EVOLUTION</span>
          </div>

          <h1 className="pres-headline">
            Train smarter.<br />
            <em>Live stronger.</em>
          </h1>

          <p className="pres-tagline">Every rep. Every meal. Every goal.</p>

          <p className="pres-desc">
            FitNova brings together everything that matters — your
            training, your meals, your goals — so you can focus on
            showing up.
          </p>

          <div className="pres-actions">
            <button
              className="pres-btn-primary"
              onClick={() => navigate('/register')}
            >
              Start for Free
            </button>
            <div className="pres-login-row">
              <span className="pres-login-hint">Already have an account?</span>
              <button
                className="pres-btn-text"
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
            </div>
          </div>

          <div className="pres-social">
            <div className="pres-avatars">
              <div className="avatar av1">A</div>
              <div className="avatar av2">M</div>
              <div className="avatar av3">L</div>
              <div className="avatar av4">R</div>
            </div>
            <span className="pres-social-text">
              Trusted by <strong>2,400+</strong> active users
            </span>
          </div>
        </div>

        <div className="pres-right">
          <div className="pres-card">
            <div className="pres-card-top">
              <div>
                <div className="pres-card-title">Good morning, Alex 👋</div>
                <div className="pres-card-sub">Tuesday · Push Day</div>
              </div>
              <div className="pres-status-chip">
                <div className="pres-status-dot"></div>
                Session Active
              </div>
            </div>

            <div className="pres-card-body">
              <div className="pres-stats-row">
                <div className="pres-stat-box">
                  <div className="pres-stat-label">CALORIES BURNED</div>
                  <div className="pres-stat-val">487 <span>kcal</span></div>
                  <div className="pres-stat-delta">↑ 8% vs avg</div>
                </div>
                <div className="pres-stat-box">
                  <div className="pres-stat-label">DURATION</div>
                  <div className="pres-stat-val">48 <span>min</span></div>
                  <div className="pres-stat-delta">On track</div>
                </div>
                <div className="pres-stat-box">
                  <div className="pres-stat-label">SETS DONE</div>
                  <div className="pres-stat-val">12 <span>/ 18</span></div>
                  <div className="pres-stat-delta">67% complete</div>
                </div>
              </div>

              <div className="pres-progress-section">
                <div className="pres-progress-item">
                  <div className="pres-progress-meta">
                    <span>Strength Goal</span>
                    <span>78%</span>
                  </div>
                  <div className="pres-progress-track">
                    <div className="pres-progress-fill" style={{ width: '78%', background: 'linear-gradient(90deg, #E0607E, #C2714F)' }}></div>
                  </div>
                </div>
                <div className="pres-progress-item">
                  <div className="pres-progress-meta">
                    <span>Calorie Burn Goal</span>
                    <span>54%</span>
                  </div>
                  <div className="pres-progress-track">
                    <div className="pres-progress-fill" style={{ width: '54%', background: 'linear-gradient(90deg, #D36060, #E0607E)' }}></div>
                  </div>
                </div>
                <div className="pres-progress-item">
                  <div className="pres-progress-meta">
                    <span>Consistency Goal</span>
                    <span>91%</span>
                  </div>
                  <div className="pres-progress-track">
                    <div className="pres-progress-fill" style={{ width: '91%', background: 'linear-gradient(90deg, #C2714F, #DBD3AD)' }}></div>
                  </div>
                </div>
              </div>

              <div className="pres-macro-row">
                <div className="pres-macro-item">
                  <div className="pres-macro-val">1,840</div>
                  <div className="pres-macro-lbl">Calories</div>
                </div>
                <div className="pres-macro-item">
                  <div className="pres-macro-val" style={{ color: '#F6C5AF' }}>142g</div>
                  <div className="pres-macro-lbl">Protein</div>
                </div>
                <div className="pres-macro-item">
                  <div className="pres-macro-val" style={{ color: '#DBD3AD' }}>190g</div>
                  <div className="pres-macro-lbl">Carbs</div>
                </div>
                <div className="pres-macro-item">
                  <div className="pres-macro-val" style={{ color: '#D36060' }}>58g</div>
                  <div className="pres-macro-lbl">Fats</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="cookie-banner">
          <div className="cookie-text">
            🍪 We use cookies to remember your preferences and activity.
          </div>
          <button className="cookie-btn" onClick={acceptCookies}>
            Accept
          </button>
        </div>
      )}

    </div>
  )
}

export default PresentationPage