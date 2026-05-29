import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchPlans, getToken } from '../services/api'
import { BASE_URL } from '../config'
import './StatisticsPage.css'

function StatisticsPage({ currentUser, plans, setPlans }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('visual')
  const [searchParams] = useSearchParams()
  const viewingUserId = searchParams.get('userId') ? parseInt(searchParams.get('userId')) : currentUser.id
  const isViewingOtherUser = !!searchParams.get('userId')
  const [statsPlans, setStatsPlans] = useState(plans)
  const [viewedUser, setViewedUser] = useState(null)

  useEffect(() => {
    if (isViewingOtherUser) {
      fetchPlans(1, 100, viewingUserId)
        .then(data => setStatsPlans(data.data))
        .catch(() => {})
      fetch(`${BASE_URL}/api/users/${viewingUserId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
        .then(res => res.json())
        .then(data => setViewedUser(data))
        .catch(() => {})
    } else {
      // Always fetch fresh from server — don't rely on stale prop
      fetchPlans(1, 100, viewingUserId)
        .then(data => {
          setStatsPlans(data.data)
          setPlans(data.data) // also update the global plans state
        })
        .catch(() => {})
    }
  }, [viewingUserId])

  const totalPlans = statsPlans.length
  const activePlan = statsPlans.find(p => p.status === 'Active')
  const totalSets = statsPlans.reduce((sum, p) =>
    sum + p.exercises.reduce((s, e) => s + e.sets, 0), 0)
  const totalExercises = statsPlans.reduce((sum, p) => sum + p.exercises.length, 0)

  function complexityScore(plan) {
    const exercises = plan.exercises.length
    const avgSets = plan.exercises.length
      ? plan.exercises.reduce((s, e) => s + e.sets, 0) / plan.exercises.length : 0
    const avgMet = plan.exercises.length
      ? plan.exercises.reduce((s, e) => s + e.met, 0) / plan.exercises.length : 0
    return Math.round(exercises * avgSets * avgMet * 10) / 10
  }

  const plansWithScore = statsPlans.map(p => ({
    ...p,
    score: complexityScore(p),
    totalSets: p.exercises.reduce((s, e) => s + e.sets, 0),
    avgMet: p.exercises.length
      ? Math.round(p.exercises.reduce((s, e) => s + e.met, 0) / p.exercises.length * 10) / 10 : 0
  })).sort((a, b) => b.score - a.score)

  const highestComplexity = plansWithScore[0]
  const maxSets = Math.max(...statsPlans.map(p =>
    p.exercises.reduce((s, e) => s + e.sets, 0)), 1)

  const muscleMap = {}
  statsPlans.forEach(p => {
    p.exercises.forEach(e => {
      const muscle = e.muscle.split('·')[0].trim()
      muscleMap[muscle] = (muscleMap[muscle] || 0) + 1
    })
  })
  const totalMuscleCount = Object.values(muscleMap).reduce((a, b) => a + b, 0) || 1
  const muscleColors = [
    '#4FC3F7', '#81C784', '#FFB74D', '#CE93D8', '#4DB6AC',
    '#FF8A65', '#AED581', '#7986CB', '#f3906d', '#4DD0E1',
    '#536aff', '#EF9A9A', '#F48FB1', '#F06292',
  ]
  const muscleEntries = Object.entries(muscleMap).map(([name, count], i) => ({
    name, count,
    pct: Math.round(count / totalMuscleCount * 100),
    color: muscleColors[i % muscleColors.length]
  }))

  let cumulative = 0
  const pieGradient = muscleEntries.map(m => {
    const start = cumulative
    cumulative += m.pct
    return `${m.color} ${start}% ${cumulative}%`
  }).join(', ')

  const summaryCards = [
    { label: 'TOTAL PLANS', value: totalPlans, sub: 'across all statuses', accent: '#E0607E' },
    { label: 'ACTIVE PLAN', value: activePlan?.name || '—', sub: 'currently in use', accent: '#C2714F', small: true },
    { label: 'TOTAL SETS', value: totalSets, sub: 'across all plans', accent: '#DBD3AD' },
    { label: 'TOTAL EXERCISES', value: totalExercises, sub: 'across all plans', accent: '#F6C5AF' },
    { label: 'HIGHEST COMPLEXITY', value: highestComplexity?.name || '—', sub: `score ${highestComplexity?.score || 0}`, accent: '#D36060', small: true },
  ]

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="1" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="15" y="8" width="4" height="4.5" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="4.5" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
            <rect x="13" y="6.5" width="2.5" height="7" rx="1.2" fill="white"/>
            <rect x="7" y="9" width="6" height="2.5" rx="1.2" fill="white" opacity="0.75"/>
          </svg>
        </div>
        <span className="sidebar-logo-name">FitNova</span>
      </div>
      <div className="sidebar-nav">
        {currentUser?.role?.name === 'admin' && (
          <>
            <div className="sidebar-section-label">ADMIN</div>
            <div className={`sidebar-item ${isViewingOtherUser ? 'active' : ''}`} onClick={() => navigate('/admin')}>👥 View Users</div>
            <div className="sidebar-item" onClick={() => navigate('/logs')}>🪵 Server Logs</div>
            <div className="sidebar-item" onClick={() => navigate('/user-logs')}>📋 User Logs</div>
            <div className="sidebar-item" onClick={() => navigate('/suspicious')}>🚨 Observation List</div>
          </>
        )}
        <div className="sidebar-section-label">MAIN</div>
        <div className="sidebar-item" onClick={e => e.stopPropagation()}>🏠 Dashboard</div>
        <div className="sidebar-section-label">TRAINING</div>
        <div className="sidebar-item" onClick={() => navigate(isViewingOtherUser ? `/plans?userId=${viewingUserId}` : '/plans')}>🏋️ Workout Plans</div>
        <div className="sidebar-item">⏱️ Sessions</div>
        <div className="sidebar-section-label">HEALTH</div>
        <div className="sidebar-item">🥗 Nutrition</div>
        <div className="sidebar-item">🎯 Goals</div>
        <div className="sidebar-section-label">INSIGHTS</div>
        <div className={`sidebar-item ${!isViewingOtherUser ? 'active' : ''}`} onClick={() => navigate('/stats')}>📊 Reports</div>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-item">👤 Profile</div>
        <div className="sidebar-item">⚙️ Settings</div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{currentUser?.firstName?.[0]}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.firstName} {currentUser?.lastName}</div>
            <div className="sidebar-user-email">{currentUser?.email}</div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="stats-page">
      <div className="sidebar">{sidebarContent}</div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      {mobileMenuOpen && (
        <div className="mobile-sidebar">
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          {sidebarContent}
        </div>
      )}

      <div className="stats-main">
        <div className="stats-topbar">
          <div className="stats-topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <button className="stats-btn-back" onClick={() => navigate(isViewingOtherUser ? `/plans?userId=${viewingUserId}` : '/plans')}>← Back</button>
            <div>
              <div className="stats-topbar-title">
                {isViewingOtherUser && viewedUser ? `${viewedUser.firstName}'s Statistics` : 'Workout Plans — Statistics'}
              </div>
              <div className="stats-topbar-sub">
                {isViewingOtherUser ? `Admin view — browsing as ${viewedUser?.firstName || 'user'}` : 'Visual and tabular overview of your training data'}
              </div>
            </div>
          </div>
        </div>

        {isViewingOtherUser && (
          <div className="admin-viewing-banner">
            🛡️ Viewing stats of <strong>{viewedUser ? `${viewedUser.firstName} ${viewedUser.lastName}` : `User #${viewingUserId}`}</strong>
            <button className="admin-viewing-back" onClick={() => navigate('/admin')}>← Back to Users</button>
          </div>
        )}

        <div className="stats-summary-row">
          {summaryCards.map((card, i) => (
            <div key={i} className="stats-summary-card">
              <div className="stats-summary-accent" style={{ background: card.accent }}></div>
              <div className="stats-summary-label">{card.label}</div>
              <div className={`stats-summary-val ${card.small ? 'small' : ''}`}>{card.value}</div>
              <div className="stats-summary-sub">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="stats-view-toggle">
          <button className={`stats-view-btn ${activeView === 'visual' ? 'active' : ''}`} onClick={() => setActiveView('visual')}>📊 Visual View</button>
          <button className={`stats-view-btn ${activeView === 'table' ? 'active' : ''}`} onClick={() => setActiveView('table')}>📋 Table View</button>
        </div>

        <div className="stats-panels">
          <div className={`stats-panel stats-panel-visual ${activeView === 'visual' ? 'active-panel' : ''}`}>
            <div className="stats-panel-header">
              <div className="stats-panel-title">Visual View</div>
              <div className="stats-panel-sub">Charts overview</div>
            </div>
            <div className="stats-panel-body">
              <div className="stats-chart-section">
                <div className="stats-chart-title">Total Sets per Plan</div>
                <div className="stats-chart-sub">Sum of sets across all exercises</div>
                <div className="stats-vertical-bars">
                  {statsPlans.map((plan) => {
                    const sets = plan.exercises.reduce((s, e) => s + e.sets, 0)
                    const pct = Math.round(sets / maxSets * 100)
                    return (
                      <div key={plan.id} className="stats-vbar-col">
                        <div className="stats-vbar-val">{sets}</div>
                        <div className="stats-vbar-track">
                          <div className="stats-vbar-fill" style={{ height: `${pct}%`, background: `linear-gradient(180deg, #E0607E, #C2714F)` }} />
                        </div>
                        <div className="stats-vbar-label">{plan.name}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="stats-chart-section">
                <div className="stats-chart-title">Exercises per Muscle Group</div>
                <div className="stats-chart-sub">Distribution across all plans</div>
                <div className="stats-pie-wrap">
                  <div className="stats-pie" style={{ background: `conic-gradient(${pieGradient})` }}></div>
                  <div className="stats-pie-legend">
                    {muscleEntries.map((m, i) => (
                      <div key={i} className="stats-pie-legend-item">
                        <div className="stats-pie-legend-dot" style={{ background: m.color }}></div>
                        <span className="stats-pie-legend-name">{m.name}</span>
                        <span className="stats-pie-legend-pct">{m.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stats-chart-section">
                <div className="stats-chart-title">Plan Complexity Score</div>
                <div className="stats-chart-sub">Auto-calculated from exercises, sets & avg MET</div>
                <div className="stats-complexity-ranking">
                  {plansWithScore.map((plan, index) => (
                    <div key={plan.id} className="stats-complexity-row">
                      <div className={`stats-rank rank-${index + 1}`}>{index + 1}</div>
                      <div className="stats-complexity-name">{plan.name}</div>
                      <div className="stats-complexity-score-val">{plan.score}</div>
                      <div className="stats-complexity-bar-wrap">
                        <div className="stats-complexity-bar" style={{
                          width: `${Math.min(plan.score / (plansWithScore[0]?.score || 1) * 100, 100)}%`,
                          background: index === 0 ? 'linear-gradient(90deg, #E0607E, #C2714F)' : index === 1 ? 'linear-gradient(90deg, #C2714F, #DBD3AD)' : 'linear-gradient(90deg, #DBD3AD, #F6C5AF)'
                        }} />
                      </div>
                      <div className="stats-complexity-pts">pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="stats-divider"></div>

          <div className={`stats-panel stats-panel-table ${activeView === 'table' ? 'active-panel' : ''}`}>
            <div className="stats-panel-header">
              <div className="stats-panel-title">Table View</div>
              <div className="stats-panel-sub">Sorted by complexity score</div>
            </div>
            <div className="stats-panel-body">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Plan Name</th><th>Status</th><th>Exercises</th><th>Total Sets</th><th>Avg MET</th><th>Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {plansWithScore.map((plan, index) => (
                    <tr key={plan.id} className={plan.status === 'Active' ? 'stats-row-active' : ''}>
                      <td><div className={`stats-rank rank-${index + 1}`}>{index + 1}</div></td>
                      <td>
                        <div className="stats-plan-name-cell">
                          <div className="stats-plan-dot" style={{ background: plan.status === 'Active' ? '#E0607E' : '#C2714F' }}></div>
                          <span>{plan.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge ${plan.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          <span className="badge-dot"></span>{plan.status}
                        </span>
                      </td>
                      <td className="stats-num">{plan.exercises.length}</td>
                      <td className="stats-num">{plan.totalSets}</td>
                      <td className="stats-num">{plan.avgMet}</td>
                      <td>
                        <div className="stats-complexity-cell">
                          <span className="stats-complexity-score">{plan.score}</span>
                          <div className="stats-complexity-track">
                            <div className="stats-complexity-fill" style={{
                              width: `${Math.min(plan.score / (plansWithScore[0]?.score || 1) * 100, 100)}%`,
                              background: 'linear-gradient(90deg, #E0607E, #C2714F)'
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {statsPlans.length === 0 && (
                    <tr><td colSpan="7" className="stats-empty">No workout plans yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage