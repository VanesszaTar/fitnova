import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../config'
import { getToken } from '../services/api'
import './SuspiciousPage.css'

function SuspiciousPage({ currentUser }) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('false')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    setEntries([])
    setPage(1)
    fetchEntries(1, true)
  }, [filter])

  useEffect(() => {
    const interval = setInterval(() => fetchEntries(1, true), 30000)
    return () => clearInterval(interval)
  }, [filter])

  async function fetchEntries(p = 1, reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 20, resolved: filter })
      const res = await fetch(`${BASE_URL}/api/logs/suspicious?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (reset) { setEntries(data.data) } else { setEntries(prev => [...prev, ...data.data]) }
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setPage(p)
    } catch {}
    setLoading(false)
  }

  async function handleResolve(id) {
    try {
      await fetch(`${BASE_URL}/api/logs/suspicious/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      setEntries(prev => prev.filter(e => e.id !== id))
      setTotal(prev => prev - 1)
    } catch {}
  }

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages && !loading) fetchEntries(page + 1)
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [page, totalPages, loading])

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
        <div className="sidebar-item" onClick={() => navigate('/user-logs')}>📋 User Logs</div>
        <div className="sidebar-item active">🚨 Observation List</div>
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
              <div className="master-topbar-title">🚨 Observation List</div>
              <div className="master-topbar-sub">{total} suspicious {total === 1 ? 'entry' : 'entries'} — auto-refreshes every 30 seconds</div>
            </div>
          </div>
          <div className="master-topbar-actions">
            <select className="logs-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
              <option value="">All</option>
            </select>
            <button className="master-btn-stats" onClick={() => fetchEntries(1, true)}>🔄 Refresh</button>
          </div>
        </div>

        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Status</th><th>User</th><th>Reason</th><th>Count</th><th>Detected At</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>
                    <span className={`log-badge ${entry.resolved ? 'susp-resolved' : 'susp-active'}`}>
                      {entry.resolved ? '✓ Resolved' : '⚠ Active'}
                    </span>
                  </td>
                  <td>
                    <div className="susp-user">
                      <div className="susp-avatar">
                        {entry.User?.firstName?.[0]}{entry.User?.lastName?.[0]}
                      </div>
                      <div>
                        <div className="susp-name">{entry.User?.firstName} {entry.User?.lastName}</div>
                        <div className="susp-email">{entry.User?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="susp-reason">{entry.reason}</td>
                  <td className="susp-count">{entry.actionCount}x</td>
                  <td className="plan-created">{formatTime(entry.detectedAt)}</td>
                  <td>
                    {!entry.resolved && (
                      <button className="susp-resolve-btn" onClick={() => handleResolve(entry.id)}>✓ Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="master-empty">
                    {filter === 'false' ? '✅ No suspicious activity detected' : 'No entries found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loading && <div className="infinite-scroll-loading">Loading...</div>}
        </div>
      </div>
    </div>
  )
}

export default SuspiciousPage