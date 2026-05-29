import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PresentationPage from './pages/PresentationPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MasterPage from './pages/MasterPage'
import DetailPage from './pages/DetailPage'
import StatisticsPage from './pages/StatisticsPage'
import AdminPage from './pages/AdminPage'
import LogsPage from './pages/LogsPage'
import UserLogsPage from './pages/UserLogsPage'
import SuspiciousPage from './pages/SuspiciousPage'
import { initialPlans } from './data/workoutPlans'
import { fetchPlans, clearToken } from './services/api'
import { startNetworkMonitor, stopNetworkMonitor, onNetworkChange, getIsOnline } from './services/network'
import { syncWithServer, hasPendingOps } from './services/sync'
import { WS_URL, BASE_URL } from './config'
import ChatWidget from './components/ChatWidget'
import TwoFactorPage from './pages/TwoFactorPage'
import SecurityQuestionPage from './pages/SecurityQuestionPage'

const INACTIVITY_LIMIT = 15 * 60 * 1000

function AppRoutes({ currentUser, setCurrentUser, plans, setPlans, isOnline, wsUpdateCount, wsRef, handleLogout }) {
  const location = useLocation()

  return (
    <>
      <Routes>
        <Route path="/" element={<PresentationPage />} />
        <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
        <Route path="/register" element={<RegisterPage setCurrentUser={setCurrentUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/two-factor" element={<TwoFactorPage />} />
        <Route path="/security-question" element={<SecurityQuestionPage setCurrentUser={setCurrentUser} />} />

        <Route
          path="/admin"
          element={
            currentUser?.role?.name === 'admin'
              ? <AdminPage currentUser={currentUser} setCurrentUser={setCurrentUser} handleLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/logs"
          element={
            currentUser?.role?.name === 'admin'
              ? <LogsPage currentUser={currentUser} setCurrentUser={setCurrentUser} handleLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/user-logs"
          element={
            currentUser?.role?.name === 'admin'
              ? <UserLogsPage currentUser={currentUser} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/suspicious"
          element={
            currentUser?.role?.name === 'admin'
              ? <SuspiciousPage currentUser={currentUser} />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/plans"
          element={
            currentUser
              ? <MasterPage
                  key={location.search}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  plans={plans}
                  setPlans={setPlans}
                  isOnline={isOnline}
                  wsUpdateCount={wsUpdateCount}
                  wsRef={wsRef}
                  handleLogout={handleLogout}
                />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/plans/:id"
          element={
            currentUser
              ? <DetailPage
                  currentUser={currentUser}
                  plans={plans}
                  setPlans={setPlans}
                  isOnline={isOnline}
                />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/stats"
          element={
            currentUser
              ? <StatisticsPage
                  key={location.search}
                  currentUser={currentUser}
                  plans={plans}
                  setPlans={setPlans}
                />
              : <Navigate to="/login" />
          }
        />
      </Routes>

      {currentUser && (
        <ChatWidget currentUser={currentUser} wsRef={wsRef} />
      )}
    </>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [plans, setPlans] = useState(initialPlans)
  const [isOnline, setIsOnline] = useState(getIsOnline())
  const currentUserRef = useRef(null)
  const [wsUpdateCount, setWsUpdateCount] = useState(0)
  const wsRef = useRef(null)

  const inactivityTimer = useRef(null)

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch {}
    clearToken()
    setCurrentUser(null)
    setPlans(initialPlans)
    if (wsRef.current) wsRef.current.close()
  }, [])

  const resetInactivityTimer = useCallback(() => {
    if (!currentUserRef.current) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_LIMIT)
  }, [handleLogout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer))
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivityTimer])

  useEffect(() => {
    currentUserRef.current = currentUser
    if (currentUser) {
      resetInactivityTimer()
    } else {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [currentUser, resetInactivityTimer])

  useEffect(() => {
    startNetworkMonitor()
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    ws.onopen = () => { console.log('WebSocket connected') }
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'NEW_PLANS') {
        const user = currentUserRef.current
        const userPlans = user ? data.plans.filter(p => p.userId === user.id) : data.plans
        setPlans([...userPlans])
        setWsUpdateCount(prev => prev + 1)
      }
    }
    ws.onerror = (err) => { console.log('WebSocket error:', err) }
    ws.onclose = () => { console.log('WebSocket disconnected') }

    const unsubscribe = onNetworkChange(async (status) => {
      setIsOnline(status)
      if (status && hasPendingOps()) {
        await syncWithServer()
        const user = currentUserRef.current
        if (user) {
          const updated = await fetchPlans(1, 100, user.id)
          setPlans(updated.data)
        }
      }
    })

    return () => {
      ws.close()
      stopNetworkMonitor()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return
    if (!isOnline) return
    fetchPlans(1, 100, currentUser.id)
      .then(data => setPlans(data.data))
      .catch(() => {})
  }, [currentUser])

  return (
    <BrowserRouter>
      <AppRoutes
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        plans={plans}
        setPlans={setPlans}
        isOnline={isOnline}
        wsUpdateCount={wsUpdateCount}
        wsRef={wsRef}
        handleLogout={handleLogout}
      />
    </BrowserRouter>
  )
}

export default App