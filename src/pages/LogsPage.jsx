import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../config'
import { getToken } from '../services/api'
import './LogsPage.css'

function LogsPage({ currentUser, setCurrentUser, handleLogout }) {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({ level: '', method: '' })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    setLogs([])
    setPage(1)
    fetchLogs(1, true)
  }, [filter])

  async function fetchStats() {
    try {
      const res = await fetch(`${BASE_URL}/api/logs/stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      setStats(data)
    } catch {}
  }

  async function fetchLogs(p = 1, reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20 })
      if (filter.level) params.append('level', filter.level)
      if (filter.method) params.append('method', filter.method)
      const res = await fetch(`${BASE_URL}/api/logs?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (reset) { setLogs(data.data) } else { setLogs(prev => [...prev, ...data.data]) }
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages && !loading) fetchLogs(page + 1)
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [page, totalPages, loading])

  function levelColor(level) {
    if (level === 'ERROR') return 'log-error'
    if (level === 'WARN') return 'log-warn'
    return 'log-info'
  }

  function methodColor(method) {
    if (method === 'GET') return 'method-get'
    if (method === 'POST') return 'method-post'
    if (method === 'DELETE') return 'method-delete'
    if (method === 'PUT') return 'method-put'
    return ''
  }

  function formatTime(ts) { return new Date(ts).toLocaleString() }

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
        <div className="sidebar-section-label">ADMIN</div>
        <div className="sidebar-item" onClick={() => navigate('/admin')}>👥 View Users</div>
        <div className="sidebar-item active">🪵 Server Logs</div>
        <div className="sidebar-item" onClick={() => navigate('/user-logs')}>📋 User Logs</div>
        <div className="sidebar-item" onClick={() => navigate('/suspicious')}>🚨 Observation List</div>
        <div className="sidebar-section-label">MAIN</div>
        <div className="sidebar-item" onClick={e => e.stopPropagation()}>🏠 Dashboard</div>
        <div className="sidebar-section-label">TRAINING</div>
        <div className="sidebar-item" onClick={() => navigate('/plans')}>🏋️ Workout Plans</div>
        <div className="sidebar-item">⏱️ Sessions</div>
        <div className="sidebar-section-label">HEALTH</div>
        <div className="sidebar-item">🥗 Nutrition</div>
        <div className="sidebar-item">🎯 Goals</div>
        <div className="sidebar-section-label">INSIGHTS</div>
        <div className="sidebar-item" onClick={() => navigate('/stats')}>📊 Reports</div>
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
    <div className="master-page">
      <div className="sidebar">{sidebarContent}</div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      {mobileMenuOpen && (
        <div className="mobile-sidebar">
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          {sidebarContent}
        </div>
      )}

      <div className="master-content">
        <div className="master-topbar">
          <div className="master-topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <div>
              <div className="master-topbar-title">Server Logs</div>
              <div className="master-topbar-sub">Real-time backend activity</div>
            </div>
          </div>
          <div className="master-topbar-actions">
            <button className="master-btn-stats" onClick={() => { fetchStats(); fetchLogs(1, true) }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {stats && (
          <div className="logs-stats-row">
            <div className="logs-stat-card">
              <div className="logs-stat-num">{stats.total}</div>
              <div className="logs-stat-lbl">Total Logs</div>
            </div>
            <div className="logs-stat-card info">
              <div className="logs-stat-num">{stats.info}</div>
              <div className="logs-stat-lbl">INFO</div>
            </div>
            <div className="logs-stat-card warn">
              <div className="logs-stat-num">{stats.warn}</div>
              <div className="logs-stat-lbl">WARN</div>
            </div>
            <div className="logs-stat-card error">
              <div className="logs-stat-num">{stats.error}</div>
              <div className="logs-stat-lbl">ERROR</div>
            </div>
            <div className="logs-stat-card">
              <div className="logs-stat-num">{stats.avgResponseTime}ms</div>
              <div className="logs-stat-lbl">Avg Response</div>
            </div>
          </div>
        )}

        <div className="logs-filters">
          <select className="logs-select" value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}>
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
          <select className="logs-select" value={filter.method} onChange={e => setFilter(f => ({ ...f, method: e.target.value }))}>
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Level</th><th>Method</th><th>Route</th><th>Status</th>
                <th>Time</th><th>User</th><th>IP</th><th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td><span className={`log-badge ${levelColor(log.level)}`}>{log.level}</span></td>
                  <td><span className={`log-method ${methodColor(log.method)}`}>{log.method}</span></td>
                  <td className="log-route">{log.route}</td>
                  <td className={`log-status ${log.statusCode >= 500 ? 'status-error' : log.statusCode >= 400 ? 'status-warn' : 'status-ok'}`}>{log.statusCode}</td>
                  <td className="plan-created">{log.responseTime}ms</td>
                  <td className="plan-created">{log.userId || '—'}</td>
                  <td className="plan-created">{log.ip}</td>
                  <td className="plan-created">{formatTime(log.timestamp)}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan="8" className="master-empty">No logs found</td></tr>
              )}
            </tbody>
          </table>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loading && <div className="infinite-scroll-loading">Loading logs...</div>}
        </div>
      </div>
    </div>
  )
}

export default LogsPage