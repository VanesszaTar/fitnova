import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../config'
import { getToken } from '../services/api'
import './UserLogsPage.css'

function UserLogsPage({ currentUser }) {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({ role: '', userId: '' })
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
      const res = await fetch(`${BASE_URL}/api/logs/user-logs/stats`, {
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
      if (filter.role) params.append('role', filter.role)
      if (filter.userId) params.append('userId', filter.userId)
      const res = await fetch(`${BASE_URL}/api/logs/user-logs?${params}`, {
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

  function roleColor(role) { return role === 'ADMIN' ? 'role-admin' : 'role-user' }
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
        <div className="sidebar-item" onClick={() => navigate('/logs')}>🪵 Server Logs</div>
        <div className="sidebar-item active">📋 User Logs</div>
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
              <div className="master-topbar-title">User Action Logs</div>
              <div className="master-topbar-sub">Every action performed by logged-in users</div>
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
              <div className="logs-stat-lbl">Total Actions</div>
            </div>
            <div className="logs-stat-card info">
              <div className="logs-stat-num">{stats.byRole?.ADMIN ?? 0}</div>
              <div className="logs-stat-lbl">ADMIN</div>
            </div>
            <div className="logs-stat-card warn">
              <div className="logs-stat-num">{stats.byRole?.USER ?? 0}</div>
              <div className="logs-stat-lbl">USER</div>
            </div>
          </div>
        )}

        <div className="logs-filters">
          <select className="logs-select" value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
          <input
            className="logs-search"
            type="number"
            placeholder="Filter by User ID..."
            value={filter.userId}
            onChange={e => setFilter(f => ({ ...f, userId: e.target.value }))}
          />
        </div>

        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>User ID</th><th>Group ID</th><th>Role</th><th>Action</th><th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="plan-created">{log.userId}</td>
                  <td className="plan-created">{log.groupId}</td>
                  <td><span className={`ul-role-badge ${roleColor(log.role)}`}>{log.role}</span></td>
                  <td className="ul-action">{log.action}</td>
                  <td className="plan-created">{formatTime(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan="5" className="master-empty">No user logs found</td></tr>
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

export default UserLogsPage