import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './DetailPage.css'
import { availableExercises } from '../data/workoutPlans'

function DetailPage({ plans, setPlans, currentUser, isOnline }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const plan = plans?.find(p => p.id === Number(id))

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showEditExercise, setShowEditExercise] = useState(null)
  const [editParams, setEditParams] = useState({})
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedAvailable, setSelectedAvailable] = useState(null)
  const [newExerciseParams, setNewExerciseParams] = useState({
    sets: 3, reps: 10, rest: 1, met: 5.0
  })
  const [addExerciseError, setAddExerciseError] = useState('')
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false)
  const [deleteExerciseId, setDeleteExerciseId] = useState(null)

  if (!plan) {
    return (
      <div className="detail-not-found">
        <p>Plan not found.</p>
        <button onClick={() => navigate('/plans')}>← Back to Plans</button>
      </div>
    )
  }

  const totalSets = plan.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const estDuration = plan.exercises.reduce((sum, ex) =>
    sum + (ex.sets * ex.reps * 0.5) + (ex.sets * ex.rest), 0
  )

  function handleActivate() {
    setPlans(plans.map(p => ({
      ...p,
      status: p.id === plan.id ? 'Active' : 'Inactive'
    })))
  }

  function confirmDeletePlan() {
    setPlans(plans.filter(p => p.id !== plan.id))
    navigate('/plans')
  }

  function confirmDeleteExercise() {
    setPlans(plans.map(p =>
      p.id === plan.id
        ? { ...p, exercises: p.exercises.filter(e => e.id !== deleteExerciseId) }
        : p
    ))
    setDeleteExerciseId(null)
  }

  function handleEditExercise(ex) {
    setShowEditExercise(ex.id)
    setEditParams({ sets: ex.sets, reps: ex.reps, rest: ex.rest, met: ex.met })
  }

  function handleSaveExercise(exId) {
    if (editParams.sets <= 0 || editParams.reps <= 0 || editParams.rest < 0) return
    setPlans(plans.map(p =>
      p.id === plan.id
        ? { ...p, exercises: p.exercises.map(e => e.id === exId ? { ...e, ...editParams } : e) }
        : p
    ))
    setShowEditExercise(null)
  }

  function handleConfirmAddExercise() {
    if (!selectedAvailable) { setAddExerciseError('Please select an exercise first'); return }
    if (newExerciseParams.sets <= 0) { setAddExerciseError('Sets must be greater than 0'); return }
    if (newExerciseParams.reps <= 0) { setAddExerciseError('Reps must be greater than 0'); return }
    if (newExerciseParams.rest < 0) { setAddExerciseError('Rest time cannot be negative'); return }
    const newEx = {
      id: Date.now(),
      name: selectedAvailable.name,
      muscle: selectedAvailable.muscle,
      sets: Number(newExerciseParams.sets),
      reps: Number(newExerciseParams.reps),
      rest: Number(newExerciseParams.rest),
      met: Number(newExerciseParams.met)
    }
    setPlans(plans.map(p =>
      p.id === plan.id ? { ...p, exercises: [...p.exercises, newEx] } : p
    ))
    setSelectedAvailable(null)
    setNewExerciseParams({ sets: 3, reps: 10, rest: 1, met: 5.0 })
    setAddExerciseError('')
    setShowAddExercise(false)
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
            <div className="sidebar-item" onClick={() => navigate('/admin')}>👥 View Users</div>
            <div className="sidebar-item" onClick={() => navigate('/logs')}>🪵 Server Logs</div>
            <div className="sidebar-item" onClick={() => navigate('/user-logs')}>📋 User Logs</div>
            <div className="sidebar-item" onClick={() => navigate('/suspicious')}>🚨 Observation List</div>
          </>
        )}
        <div className="sidebar-section-label">MAIN</div>
        <div className="sidebar-item" onClick={e => e.stopPropagation()}>🏠 Dashboard</div>
        <div className="sidebar-section-label">TRAINING</div>
        <div className="sidebar-item active" onClick={() => navigate('/plans')}>🏋️ Workout Plans</div>
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
    <div className="detail-page">

      <div className="sidebar">{sidebarContent}</div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {mobileMenuOpen && (
        <div className="mobile-sidebar">
          <button className="mobile-sidebar-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          {sidebarContent}
        </div>
      )}

      <div className="detail-main">

        {!isOnline && (
          <div className="offline-banner">
            ⚠ You are offline — changes will sync when connection is restored
          </div>
        )}

        <div className="detail-topbar">
          <div className="detail-topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <button className="detail-btn-back" onClick={() => navigate('/plans')}>← Back</button>
            <div className="detail-breadcrumb">
              <span className="breadcrumb-parent" onClick={() => navigate('/plans')}>Workout Plans</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{plan.name}</span>
            </div>
          </div>
          <div className="detail-topbar-right">
            <button className="detail-btn-delete" onClick={() => setShowDeletePlanModal(true)}>🗑 Delete</button>
            {plan.status === 'Active' ? (
              <button className="detail-btn-activate disabled" disabled>✓ Already Active</button>
            ) : (
              <button className="detail-btn-activate" onClick={handleActivate}>▶ Activate Plan</button>
            )}
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-left">
            <div className="detail-plan-header">
              <div className="detail-status-row">
                <span className={`plan-badge ${plan.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                  <span className="badge-dot"></span>{plan.status}
                </span>
                <span className="detail-plan-id">ID #{String(plan.id).padStart(3, '0')}</span>
              </div>
              <div className="detail-plan-name">{plan.name}</div>
              <div className="detail-plan-desc">{plan.description}</div>
            </div>

            <div className="detail-meta">
              <div className="detail-meta-item">
                <div className="detail-meta-label">EXERCISES</div>
                <div className="detail-meta-val">{plan.exercises.length}<span>total</span></div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">TOTAL SETS</div>
                <div className="detail-meta-val">{totalSets}<span>sets</span></div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">EST. DURATION</div>
                <div className="detail-meta-val">{Math.round(estDuration)}<span>min</span></div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">CREATED</div>
                <div className="detail-meta-val" style={{ fontSize: '13px' }}>{plan.created}</div>
              </div>
            </div>

            <button className="detail-btn-add-exercise" onClick={() => {
              setShowAddExercise(!showAddExercise)
              setSelectedAvailable(null)
              setAddExerciseError('')
            }}>
              + Add Exercise to Plan
            </button>

            {showAddExercise && (
              <div className="detail-add-exercise-panel">
                <div className="detail-add-panel-title">Select an exercise</div>
                <div className="detail-add-exercise-list">
                  {availableExercises.map(ex => (
                    <div
                      key={ex.id}
                      className={`detail-add-option ${selectedAvailable?.id === ex.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAvailable(ex)}
                    >
                      <span className="detail-add-option-name">{ex.name}</span>
                      <span className="detail-add-option-muscle">{ex.muscle}</span>
                    </div>
                  ))}
                </div>
                {selectedAvailable && (
                  <div className="detail-add-params">
                    <div className="detail-add-params-title">
                      Configure: <strong>{selectedAvailable.name}</strong>
                    </div>
                    <div className="detail-add-params-grid">
                      <div className="detail-add-field">
                        <label>SETS</label>
                        <input type="number" min="1" value={newExerciseParams.sets}
                          onChange={e => setNewExerciseParams({ ...newExerciseParams, sets: e.target.value })} />
                      </div>
                      <div className="detail-add-field">
                        <label>REPS</label>
                        <input type="number" min="1" value={newExerciseParams.reps}
                          onChange={e => setNewExerciseParams({ ...newExerciseParams, reps: e.target.value })} />
                      </div>
                      <div className="detail-add-field">
                        <label>REST (min)</label>
                        <input type="number" min="0" step="0.5" value={newExerciseParams.rest}
                          onChange={e => setNewExerciseParams({ ...newExerciseParams, rest: e.target.value })} />
                      </div>
                      <div className="detail-add-field">
                        <label>MET</label>
                        <input type="number" min="1" step="0.5" value={newExerciseParams.met}
                          onChange={e => setNewExerciseParams({ ...newExerciseParams, met: e.target.value })} />
                      </div>
                    </div>
                    {addExerciseError && <div className="detail-add-error">{addExerciseError}</div>}
                    <button className="detail-add-confirm-btn" onClick={handleConfirmAddExercise}>
                      + Add to Plan
                    </button>
                  </div>
                )}
                {!selectedAvailable && addExerciseError && (
                  <div className="detail-add-error">{addExerciseError}</div>
                )}
              </div>
            )}
          </div>

          <div className="detail-divider"></div>

          <div className="detail-right">
            <div className="detail-exercises-header">
              <div className="detail-exercises-title">Exercises in this plan</div>
              <div className="detail-exercises-sub">
                {plan.exercises.length} exercises · click ✏️ to edit parameters
              </div>
            </div>

            <div className="detail-exercises-list">
              {plan.exercises.length === 0 ? (
                <div className="detail-empty">
                  No exercises yet — use the button on the left to add some.
                </div>
              ) : (
                plan.exercises.map((ex, index) => (
                  <div key={ex.id} className="detail-exercise-card">
                    <div className="detail-ex-top">
                      <div className="detail-ex-left">
                        <div className="detail-ex-num">{index + 1}</div>
                        <div>
                          <div className="detail-ex-name">{ex.name}</div>
                          <div className="detail-ex-muscle">{ex.muscle}</div>
                        </div>
                      </div>
                      <div className="detail-ex-actions">
                        <button className="detail-ex-btn-edit" onClick={() => handleEditExercise(ex)}>✏️</button>
                        <button className="detail-ex-btn-delete" onClick={() => setDeleteExerciseId(ex.id)}>🗑</button>
                      </div>
                    </div>

                    {showEditExercise === ex.id ? (
                      <div className="detail-ex-edit">
                        <div className="detail-ex-edit-grid">
                          <div className="detail-ex-edit-field">
                            <label>SETS</label>
                            <input type="number" min="1" value={editParams.sets}
                              onChange={e => setEditParams({ ...editParams, sets: Number(e.target.value) })} />
                          </div>
                          <div className="detail-ex-edit-field">
                            <label>REPS</label>
                            <input type="number" min="1" value={editParams.reps}
                              onChange={e => setEditParams({ ...editParams, reps: Number(e.target.value) })} />
                          </div>
                          <div className="detail-ex-edit-field">
                            <label>REST (min)</label>
                            <input type="number" min="0" step="0.5" value={editParams.rest}
                              onChange={e => setEditParams({ ...editParams, rest: Number(e.target.value) })} />
                          </div>
                          <div className="detail-ex-edit-field">
                            <label>MET</label>
                            <input type="number" min="1" step="0.5" value={editParams.met}
                              onChange={e => setEditParams({ ...editParams, met: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="detail-ex-edit-actions">
                          <button className="detail-ex-btn-cancel" onClick={() => setShowEditExercise(null)}>Cancel</button>
                          <button className="detail-ex-btn-save" onClick={() => handleSaveExercise(ex.id)}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-ex-params">
                        <div className="detail-ex-param">
                          <div className="detail-ex-param-label">SETS</div>
                          <div className="detail-ex-param-val">{ex.sets}<span>sets</span></div>
                        </div>
                        <div className="detail-ex-param">
                          <div className="detail-ex-param-label">REPS</div>
                          <div className="detail-ex-param-val">{ex.reps}<span>reps</span></div>
                        </div>
                        <div className="detail-ex-param">
                          <div className="detail-ex-param-label">REST TIME</div>
                          <div className="detail-ex-param-val">{ex.rest}<span>min</span></div>
                        </div>
                        <div className="detail-ex-param">
                          <div className="detail-ex-param-label">MET VALUE</div>
                          <div className="detail-ex-param-val">{ex.met}<span>MET</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeletePlanModal && (
        <div className="modal-overlay" onClick={() => setShowDeletePlanModal(false)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-icon">🗑️</div>
            <div className="detail-modal-title">Delete Workout Plan?</div>
            <div className="detail-modal-sub">
              Are you sure you want to delete <strong>"{plan.name}"</strong>? This action cannot be undone.
            </div>
            <div className="detail-modal-footer">
              <button className="detail-modal-btn-cancel" onClick={() => setShowDeletePlanModal(false)}>Keep Plan</button>
              <button className="detail-modal-btn-delete" onClick={confirmDeletePlan}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteExerciseId && (
        <div className="modal-overlay" onClick={() => setDeleteExerciseId(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-icon">🗑️</div>
            <div className="detail-modal-title">Remove Exercise?</div>
            <div className="detail-modal-sub">
              Are you sure you want to remove{' '}
              <strong>"{plan.exercises.find(e => e.id === deleteExerciseId)?.name}"</strong>{' '}
              from this plan?
            </div>
            <div className="detail-modal-footer">
              <button className="detail-modal-btn-cancel" onClick={() => setDeleteExerciseId(null)}>Keep Exercise</button>
              <button className="detail-modal-btn-delete" onClick={confirmDeleteExercise}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailPage