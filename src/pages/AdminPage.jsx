import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_URL } from '../config'
import { getToken } from '../services/api'
import './AdminPage.css'

function AdminPage({ currentUser, setCurrentUser, handleLogout }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    fetch(`${BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleDeleteUser(id, name) {
    setUserToDelete({ id, name })
    setShowDeleteModal(true)
  }

  async function confirmDeleteUser() {
    try {
      await fetch(`${BASE_URL}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      setUsers(users.filter(u => u.id !== userToDelete.id))
    } catch (err) {
      console.error('Failed to delete user', err)
    }
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

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
        <div className="sidebar-item active">👥 View Users</div>
        <div className="sidebar-item" onClick={() => navigate('/logs')}>🪵 Server Logs</div>
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
              <div className="master-topbar-title">All Users</div>
              <div className="master-topbar-sub">Click on a user to view their workout plans</div>
            </div>
          </div>
          <div className="master-topbar-actions">
            <div className="admin-badge">🛡️ Admin Panel</div>
            {/* handleLogout from App.jsx — clears token + user state */}
            <button className="admin-logout-btn" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="admin-stat-num">{users.length}</div>
            <div className="admin-stat-lbl">Total Users</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-num">{users.filter(u => u.roleId === 1).length}</div>
            <div className="admin-stat-lbl">Admins</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-num">{users.filter(u => u.roleId === 2).length}</div>
            <div className="admin-stat-lbl">Regular Users</div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading users...</div>
        ) : (
          <div className="admin-users-grid">
            {users.map(user => (
              <div key={user.id} className="admin-user-card" onClick={() => navigate(`/plans?userId=${user.id}`)}>
                <div className="admin-user-card-top">
                  <div className="admin-user-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">
                      {user.firstName} {user.lastName}
                      {user.id === currentUser.id && <span className="admin-you-badge">you</span>}
                    </div>
                    <div className="admin-user-email">{user.email}</div>
                  </div>
                  <div className={`admin-role-badge ${user.roleId === 1 ? 'role-admin' : 'role-user'}`}>
                    {user.roleId === 1 ? '🛡️ Admin' : '👤 User'}
                  </div>
                </div>
                <div className="admin-user-card-bottom">
                  <div className="admin-user-detail">
                    <span className="admin-detail-label">Age</span>
                    <span className="admin-detail-value">{user.age || '—'}</span>
                  </div>
                  <div className="admin-user-detail">
                    <span className="admin-detail-label">Gender</span>
                    <span className="admin-detail-value">{user.gender || '—'}</span>
                  </div>
                  <div className="admin-user-detail">
                    <span className="admin-detail-label">View Plans</span>
                    <span className="admin-detail-value admin-arrow">→</span>
                  </div>
                  {user.id !== currentUser.id && (
                    <button className="admin-delete-user-btn" onClick={e => {
                      e.stopPropagation()
                      handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)
                    }}>🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-delete" onClick={e => e.stopPropagation()}>
            <div className="delete-icon">🗑️</div>
            <div className="modal-title" style={{ color: '#fff', fontSize: 17, fontWeight: 600 }}>Delete User?</div>
            <div className="delete-sub">
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="modal-btn-delete" onClick={confirmDeleteUser}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage