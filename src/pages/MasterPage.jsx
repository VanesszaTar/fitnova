import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { validatePlan, availableExercises } from '../data/workoutPlans'
import { saveFilterPref, getFilterPref, saveLastVisitedPlan, getLastVisitedPlan } from '../utils/cookies'
import { createPlan, updatePlan, deletePlan, activatePlan, fetchPlans, getToken } from '../services/api'
import { queueOperation } from '../services/sync'
import { BASE_URL } from '../config'
import './MasterPage.css'

const PLANS_PER_PAGE = 12

function MasterPage({ currentUser, setCurrentUser, plans, setPlans, isOnline, wsUpdateCount, wsRef, handleLogout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawUserId = searchParams.get('userId')
  const viewingUserId = rawUserId ? parseInt(rawUserId) : currentUser.id
  const isViewingOtherUser = rawUserId !== null && parseInt(rawUserId) !== currentUser.id

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [displayedPlans, setDisplayedPlans] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [prefetchCache, setPrefetchCache] = useState({})
  const sentinelRef = useRef(null)
  const prefetchingRef = useRef(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [selectedExercises, setSelectedExercises] = useState([])
  const [showExercisePanel, setShowExercisePanel] = useState(false)
  const [exerciseParams, setExerciseParams] = useState({ sets: 3, reps: 10, rest: 1, met: 5.0 })
  const [selectedAvailable, setSelectedAvailable] = useState(null)
  const [exerciseError, setExerciseError] = useState('')
  const [generatorRunning, setGeneratorRunning] = useState(false)
  const [viewedUser, setViewedUser] = useState(null)

  useEffect(() => {
    const savedFilter = getFilterPref()
    if (savedFilter) setFilter(savedFilter)
  }, [])

  useEffect(() => {
    if (isViewingOtherUser) {
      fetch(`${BASE_URL}/api/users/${viewingUserId}`)
        .then(res => res.json())
        .then(data => setViewedUser(data))
        .catch(() => {})
    }
  }, [viewingUserId])

  useEffect(() => {
    fetch(`${BASE_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ generatorStatus { isRunning } }' })
    })
      .then(res => res.json())
      .then(data => setGeneratorRunning(data.data?.generatorStatus?.isRunning || false))
      .catch(() => {})
  }, [])

  const prefetchPage = useCallback(async (page) => {
    if (prefetchingRef.current) return
    if (prefetchCache[page]) return
    prefetchingRef.current = true
    try {
      const result = await fetchPlans(page, PLANS_PER_PAGE, viewingUserId)
      setPrefetchCache(prev => ({ ...prev, [page]: result }))
    } catch {}
    prefetchingRef.current = false
  }, [prefetchCache, viewingUserId])

  useEffect(() => {
    async function initialLoad() {
      setDisplayedPlans([])
      setPrefetchCache({})
      setCurrentPage(1)
      setLoadingMore(true)
      try {
        const result = await fetchPlans(1, PLANS_PER_PAGE, viewingUserId)
        setDisplayedPlans(result.data)
        setTotalPages(result.totalPages)
        setTotalCount(result.total)
        setCurrentPage(1)
        if (result.totalPages > 1) prefetchPage(2)
      } catch {}
      setLoadingMore(false)
    }
    initialLoad()
  }, [viewingUserId])

  useEffect(() => {
    async function refresh() {
      try {
        const result = await fetchPlans(1, PLANS_PER_PAGE, viewingUserId)
        setDisplayedPlans(result.data)
        setTotalPages(result.totalPages)
        setTotalCount(result.total)
        setCurrentPage(1)
        setPrefetchCache({})
      } catch {}
    }
    refresh()
  }, [wsUpdateCount])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) return
        if (loadingMore) return
        if (currentPage >= totalPages) return
        const nextPage = currentPage + 1
        setLoadingMore(true)
        try {
          let result
          if (prefetchCache[nextPage]) {
            result = prefetchCache[nextPage]
          } else {
            result = await fetchPlans(nextPage, PLANS_PER_PAGE, viewingUserId)
          }
          setDisplayedPlans(prev => [...prev, ...result.data])
          setCurrentPage(nextPage)
          setTotalPages(result.totalPages)
          if (nextPage < result.totalPages) prefetchPage(nextPage + 1)
        } catch {}
        setLoadingMore(false)
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [currentPage, totalPages, loadingMore, prefetchCache])

  useEffect(() => {
    if (displayedPlans.length === 0) return
    if (currentPage >= totalPages) return
    const nextPage = currentPage + 1
    if (!prefetchCache[nextPage]) prefetchPage(nextPage)
  }, [displayedPlans.length, currentPage])

  const filteredDisplayed = displayedPlans.filter(p => {
    const matchesFilter = filter === 'All' || p.status === filter
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  function handleAdd() {
    setFormData({ name: '', description: '' })
    setFormErrors({})
    setSelectedExercises([])
    setShowExercisePanel(false)
    setSelectedAvailable(null)
    setExerciseParams({ sets: 3, reps: 10, rest: 1, met: 5.0 })
    setExerciseError('')
    setShowAddModal(true)
  }

  function handleAddExercise() {
    if (!selectedAvailable) { setExerciseError('Please select an exercise first'); return }
    if (exerciseParams.sets <= 0) { setExerciseError('Sets must be greater than 0'); return }
    if (exerciseParams.reps <= 0) { setExerciseError('Reps must be greater than 0'); return }
    if (exerciseParams.rest < 0) { setExerciseError('Rest time cannot be negative'); return }
    setExerciseError('')
    setSelectedExercises([...selectedExercises, {
      id: Date.now(),
      name: selectedAvailable.name,
      muscle: selectedAvailable.muscle,
      sets: Number(exerciseParams.sets),
      reps: Number(exerciseParams.reps),
      rest: Number(exerciseParams.rest),
      met: Number(exerciseParams.met)
    }])
    setSelectedAvailable(null)
    setExerciseParams({ sets: 3, reps: 10, rest: 1, met: 5.0 })
    setShowExercisePanel(false)
  }

  function handleRemoveExercise(id) {
    setSelectedExercises(selectedExercises.filter(e => e.id !== id))
  }

  function handleEdit(plan) {
    setSelectedPlan(plan)
    setFormData({ name: plan.name, description: plan.description })
    setSelectedExercises([...plan.exercises])
    setFormErrors({})
    setShowExercisePanel(false)
    setSelectedAvailable(null)
    setExerciseParams({ sets: 3, reps: 10, rest: 1, met: 5.0 })
    setExerciseError('')
    setShowEditModal(true)
  }

  function handleDelete(plan) { setSelectedPlan(plan); setShowDeleteModal(true) }

  async function handleActivate(id) {
    if (isOnline) {
      try { await activatePlan(id) } catch {}
    } else {
      queueOperation('ACTIVATE_PLAN', { id })
    }
    setPlans(plans.map(p => ({ ...p, status: p.id === id ? 'Active' : 'Inactive' })))
    setDisplayedPlans(prev => prev.map(p => ({ ...p, status: p.id === id ? 'Active' : 'Inactive' })))
  }

  async function handleAddSubmit() {
    const errors = validatePlan(formData)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    const newPlan = {
      id: Date.now(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: 'Inactive',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      exercises: selectedExercises,
      userId: currentUser.id
    }
    if (isOnline) {
      try {
        const created = await createPlan(newPlan, currentUser.id)
        setPlans([...plans, created])
        setDisplayedPlans(prev => [...prev, created])
        setTotalCount(prev => prev + 1)
      } catch {
        setPlans([...plans, newPlan])
        setDisplayedPlans(prev => [...prev, newPlan])
        queueOperation('CREATE_PLAN', newPlan)
      }
    } else {
      setPlans([...plans, newPlan])
      setDisplayedPlans(prev => [...prev, newPlan])
      queueOperation('CREATE_PLAN', newPlan)
    }
    setShowAddModal(false)
  }

  async function handleEditSubmit() {
    const errors = validatePlan(formData)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    const updated = {
      ...selectedPlan,
      name: formData.name.trim(),
      description: formData.description.trim(),
      exercises: selectedExercises
    }
    if (isOnline) {
      try { await updatePlan(selectedPlan.id, updated) } catch {}
    } else {
      queueOperation('UPDATE_PLAN', updated)
    }
    setPlans(plans.map(p => p.id === selectedPlan.id ? updated : p))
    setDisplayedPlans(prev => prev.map(p => p.id === selectedPlan.id ? updated : p))
    setShowEditModal(false)
  }

  async function handleDeleteConfirm() {
    if (isOnline) {
      try { await deletePlan(selectedPlan.id) } catch {}
    } else {
      queueOperation('DELETE_PLAN', { id: selectedPlan.id })
    }
    setPlans(plans.filter(p => p.id !== selectedPlan.id))
    setDisplayedPlans(prev => prev.filter(p => p.id !== selectedPlan.id))
    setTotalCount(prev => prev - 1)
    setShowDeleteModal(false)
  }

  // ── Generator ────────────────────────────────────────────────────────────
  async function handleStartGenerator() {
    try {
      const res = await fetch(`${BASE_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          query: `mutation { startGenerator(interval: 2000, userId: ${currentUser.id}) { message } }`
        })
      })
      const data = await res.json()
      if (!data.errors) setGeneratorRunning(true)
    } catch (err) { console.log('Failed to start generator', err) }
  }

  async function handleStopGenerator() {
    try {
      const res = await fetch(`${BASE_URL}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ query: 'mutation { stopGenerator { message } }' })
      })
      const data = await res.json()
      if (!data.errors) setGeneratorRunning(false)
    } catch { console.log('Failed to stop generator') }
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
        <div className={`sidebar-item ${!isViewingOtherUser ? 'active' : ''}`} onClick={() => navigate('/plans')}>🏋️ Workout Plans</div>
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
        {!isOnline && (
          <div className="offline-banner">⚠ You are offline — changes will sync when connection is restored</div>
        )}
        {isViewingOtherUser && (
          <div className="admin-viewing-banner">
            🛡️ Viewing plans of <strong>{viewedUser ? `${viewedUser.firstName} ${viewedUser.lastName}` : `User #${viewingUserId}`}</strong>
            <button className="admin-viewing-back" onClick={() => navigate('/admin')}>← Back to Users</button>
          </div>
        )}

        <div className="master-topbar">
          <div className="master-topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <div>
              <div className="master-topbar-title">
                {isViewingOtherUser && viewedUser ? `${viewedUser.firstName}'s Plans` : 'Workout Plans'}
              </div>
              <div className="master-topbar-sub">
                {isViewingOtherUser
                  ? `Admin view — browsing as ${viewedUser?.firstName || 'user'}`
                  : 'Manage your training plans — click any row to view details'}
              </div>
            </div>
          </div>
          <div className="master-topbar-actions">
            {!isViewingOtherUser && (
              <>
                {generatorRunning ? (
                  <button className="master-btn-generator-stop" onClick={handleStopGenerator}>⏹ Stop Generator</button>
                ) : (
                  <button className="master-btn-generator-start" onClick={handleStartGenerator}>▶ Start Generator</button>
                )}
              </>
            )}
            <button className="master-btn-stats" onClick={() => navigate(isViewingOtherUser ? `/stats?userId=${viewingUserId}` : '/stats')}>
              📊 View Stats
            </button>
            {!isViewingOtherUser && (
              <button className="master-btn-add" onClick={handleAdd}>+ New Plan</button>
            )}
            {/* Logout button — uses handleLogout from App.jsx which clears the token */}
            <button className="admin-logout-btn" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <div className="master-toolbar">
          <div className="master-search-wrap">
            <span className="master-search-icon">🔍</span>
            <input
              className="master-search"
              placeholder="Search workout plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="master-filters">
            {['All', 'Active', 'Inactive'].map(f => (
              <button
                key={f}
                className={`master-filter ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); saveFilterPref(f) }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {!isViewingOtherUser && (
          <div className="master-cookie-bar">
            {getFilterPref() && (
              <div className="master-cookie-item">🍪 Last filter: <span>{getFilterPref()}</span></div>
            )}
            {getLastVisitedPlan() && (
              <div className="master-cookie-item">🍪 Last visited plan ID: <span>#{getLastVisitedPlan()}</span></div>
            )}
          </div>
        )}

        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Description</th>
                <th>Exercises</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisplayed.length === 0 && !loadingMore ? (
                <tr><td colSpan="6" className="master-empty">No workout plans found</td></tr>
              ) : (
                filteredDisplayed.map(plan => (
                  <tr
                    key={plan.id}
                    className={plan.status === 'Active' ? 'row-active' : ''}
                    onClick={() => { saveLastVisitedPlan(plan.id); navigate(`/plans/${plan.id}`) }}
                  >
                    <td>
                      <div className="plan-name-cell">
                        <div className="plan-dot" style={{ background: plan.status === 'Active' ? 'var(--rose)' : 'var(--cinnamon)' }} />
                        <span className="plan-name">{plan.name}</span>
                      </div>
                    </td>
                    <td className="plan-desc">{plan.description}</td>
                    <td className="plan-exercises">🏋️ {plan.exercises.length} exercises</td>
                    <td>
                      <span className={`plan-badge ${plan.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        <span className="badge-dot" />{plan.status}
                      </span>
                    </td>
                    <td className="plan-created">{plan.created}</td>
                    <td>
                      <div className="plan-actions" onClick={e => e.stopPropagation()}>
                        {plan.status === 'Inactive' && !isViewingOtherUser && (
                          <button className="btn-activate" onClick={() => handleActivate(plan.id)}>Activate</button>
                        )}
                        {!isViewingOtherUser && (
                          <button className="btn-edit" onClick={() => handleEdit(plan)}>✏️</button>
                        )}
                        {(!isViewingOtherUser || currentUser?.role?.name === 'admin') && (
                          <button className="btn-delete" onClick={() => handleDelete(plan)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <div className="infinite-scroll-loading">Loading more plans...</div>}
          {!loadingMore && currentPage >= totalPages && filteredDisplayed.length > 0 && (
            <div className="infinite-scroll-end">Showing all {displayedPlans.length} plans</div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Workout Plan</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>PLAN NAME</label>
                <input placeholder="e.g. Push Day A" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'input-error' : ''} />
                {formErrors.name && <div className="modal-error">{formErrors.name}</div>}
              </div>
              <div className="modal-field">
                <label>DESCRIPTION</label>
                <textarea placeholder="Describe this workout plan..." value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={formErrors.description ? 'input-error' : ''} />
                {formErrors.description && <div className="modal-error">{formErrors.description}</div>}
              </div>
              <div className="modal-exercises-header">
                <label>EXERCISES ({selectedExercises.length} added)</label>
                <button className="modal-btn-add-exercise" onClick={() => { setShowExercisePanel(!showExercisePanel); setExerciseError('') }}>+ Add Exercise</button>
              </div>
              {showExercisePanel && (
                <div className="exercise-panel">
                  <div className="exercise-panel-title">Select an exercise</div>
                  <div className="exercise-list">
                    {availableExercises.map(ex => (
                      <div key={ex.id} className={`exercise-option ${selectedAvailable?.id === ex.id ? 'selected' : ''}`} onClick={() => setSelectedAvailable(ex)}>
                        <span className="exercise-option-name">{ex.name}</span>
                        <span className="exercise-option-muscle">{ex.muscle}</span>
                      </div>
                    ))}
                  </div>
                  {selectedAvailable && (
                    <div className="exercise-params">
                      <div className="exercise-params-title">Configure: <strong>{selectedAvailable.name}</strong></div>
                      <div className="exercise-params-grid">
                        {[
                          { label: 'SETS', key: 'sets', min: 1, step: 1 },
                          { label: 'REPS', key: 'reps', min: 1, step: 1 },
                          { label: 'REST (min)', key: 'rest', min: 0, step: 0.5 },
                          { label: 'MET VALUE', key: 'met', min: 1, step: 0.5 },
                        ].map(({ label, key, min, step }) => (
                          <div className="modal-field" key={key}>
                            <label>{label}</label>
                            <input type="number" min={min} step={step} value={exerciseParams[key]}
                              onChange={e => setExerciseParams({ ...exerciseParams, [key]: e.target.value })} />
                          </div>
                        ))}
                      </div>
                      {exerciseError && <div className="modal-error">{exerciseError}</div>}
                      <button className="modal-btn-confirm-exercise" onClick={handleAddExercise}>+ Add to Plan</button>
                    </div>
                  )}
                  {!selectedAvailable && exerciseError && <div className="modal-error">{exerciseError}</div>}
                </div>
              )}
              {selectedExercises.length > 0 && (
                <div className="added-exercises">
                  {selectedExercises.map((ex, index) => (
                    <div key={ex.id} className="added-exercise-row">
                      <div className="added-ex-num">{index + 1}</div>
                      <div className="added-ex-name">{ex.name}</div>
                      <div className="added-ex-params">
                        <span>{ex.sets} sets</span>
                        <span>{ex.reps} reps</span>
                        <span>{ex.rest} min</span>
                        <span>MET {ex.met}</span>
                      </div>
                      <button className="added-ex-remove" onClick={() => handleRemoveExercise(ex.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="modal-btn-save" onClick={handleAddSubmit}>Save Plan</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Workout Plan</div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>PLAN NAME</label>
                <input placeholder="e.g. Push Day A" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'input-error' : ''} />
                {formErrors.name && <div className="modal-error">{formErrors.name}</div>}
              </div>
              <div className="modal-field">
                <label>DESCRIPTION</label>
                <textarea placeholder="Describe this workout plan..." value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={formErrors.description ? 'input-error' : ''} />
                {formErrors.description && <div className="modal-error">{formErrors.description}</div>}
              </div>
              <div className="modal-exercises-header">
                <label>EXERCISES ({selectedExercises.length} added)</label>
                <button className="modal-btn-add-exercise" onClick={() => { setShowExercisePanel(!showExercisePanel); setExerciseError('') }}>+ Add Exercise</button>
              </div>
              {showExercisePanel && (
                <div className="exercise-panel">
                  <div className="exercise-panel-title">Select an exercise</div>
                  <div className="exercise-list">
                    {availableExercises.map(ex => (
                      <div key={ex.id} className={`exercise-option ${selectedAvailable?.id === ex.id ? 'selected' : ''}`} onClick={() => setSelectedAvailable(ex)}>
                        <span className="exercise-option-name">{ex.name}</span>
                        <span className="exercise-option-muscle">{ex.muscle}</span>
                      </div>
                    ))}
                  </div>
                  {selectedAvailable && (
                    <div className="exercise-params">
                      <div className="exercise-params-title">Configure: <strong>{selectedAvailable.name}</strong></div>
                      <div className="exercise-params-grid">
                        {[
                          { label: 'SETS', key: 'sets', min: 1, step: 1 },
                          { label: 'REPS', key: 'reps', min: 1, step: 1 },
                          { label: 'REST (min)', key: 'rest', min: 0, step: 0.5 },
                          { label: 'MET VALUE', key: 'met', min: 1, step: 0.5 },
                        ].map(({ label, key, min, step }) => (
                          <div className="modal-field" key={key}>
                            <label>{label}</label>
                            <input type="number" min={min} step={step} value={exerciseParams[key]}
                              onChange={e => setExerciseParams({ ...exerciseParams, [key]: e.target.value })} />
                          </div>
                        ))}
                      </div>
                      {exerciseError && <div className="modal-error">{exerciseError}</div>}
                      <button className="modal-btn-confirm-exercise" onClick={handleAddExercise}>+ Add to Plan</button>
                    </div>
                  )}
                  {!selectedAvailable && exerciseError && <div className="modal-error">{exerciseError}</div>}
                </div>
              )}
              {selectedExercises.length > 0 && (
                <div className="added-exercises">
                  {selectedExercises.map((ex, index) => (
                    <div key={ex.id} className="added-exercise-row">
                      <div className="added-ex-num">{index + 1}</div>
                      <div className="added-ex-name">{ex.name}</div>
                      <div className="added-ex-params">
                        {[
                          { key: 'sets', label: 'sets', min: 1, step: 1, check: v => v > 0 },
                          { key: 'reps', label: 'reps', min: 1, step: 1, check: v => v > 0 },
                          { key: 'rest', label: 'min', min: 0, step: 0.5, check: v => v >= 0 },
                          { key: 'met', label: 'MET', min: 1, step: 0.5, check: v => v > 0 },
                        ].map(({ key, label, min, step, check }) => (
                          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="number" min={min} step={step} value={ex[key]} className="inline-param-input"
                              onChange={e => {
                                const val = Number(e.target.value)
                                if (check(val)) setSelectedExercises(selectedExercises.map(s =>
                                  s.id === ex.id ? { ...s, [key]: val } : s
                                ))
                              }} />
                            <span className="inline-param-label">{label}</span>
                          </span>
                        ))}
                      </div>
                      <button className="added-ex-remove" onClick={() => handleRemoveExercise(ex.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="modal-btn-save" onClick={handleEditSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-delete" onClick={e => e.stopPropagation()}>
            <div className="delete-icon">🗑️</div>
            <div className="modal-title">Delete Workout Plan?</div>
            <div className="delete-sub">
              Are you sure you want to delete <strong>"{selectedPlan?.name}"</strong>? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Keep Plan</button>
              <button className="modal-btn-delete" onClick={handleDeleteConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterPage