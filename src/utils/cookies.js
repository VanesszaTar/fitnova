// ─── Core ───────────────────────────────────────────────
export function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

export function getCookie(name) {
  const match = document.cookie.split(';').find(c => c.trim().startsWith(name + '='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

export function deleteCookie(name) {
  setCookie(name, '', -1)
}

// ─── Consent ────────────────────────────────────────────
export const isFirstVisit = () => !getCookie('fitnova_visited')
export const markVisited  = () => setCookie('fitnova_visited', 'true', 365)
export const hasConsent   = () => getCookie('fitnova_visited') === 'true'

// ─── Session ────────────────────────────────────────────
export const saveSession  = (email) => setCookie('fitnova_session', email, 1)
export const getSession   = () => getCookie('fitnova_session')
export const clearSession = () => deleteCookie('fitnova_session')

// ─── Login Activity ─────────────────────────────────────
export const saveLastLogin = () => setCookie('fitnova_lastLogin', new Date().toISOString(), 30)
export const getLastLogin  = () => getCookie('fitnova_lastLogin')

export function incrementLoginCount() {
  const count = Number(getCookie('fitnova_loginCount') || 0) + 1
  setCookie('fitnova_loginCount', count, 365)
}
export const getLoginCount = () => Number(getCookie('fitnova_loginCount') || 0)

export const updateLastActive = () => setCookie('fitnova_lastActive', new Date().toISOString(), 30)
export const getLastActive    = () => getCookie('fitnova_lastActive')

// ─── Preferences ────────────────────────────────────────
export const saveFilterPref   = (filter) => setCookie('fitnova_preferredFilter', filter, 30)
export const getFilterPref    = () => getCookie('fitnova_preferredFilter')

export const saveSidebarState = (collapsed) => setCookie('fitnova_sidebarCollapsed', collapsed, 365)
export const getSidebarState  = () => getCookie('fitnova_sidebarCollapsed') === 'true'

export const savePlansPerPage = (n) => setCookie('fitnova_plansPerPage', n, 365)
export const getPlansPerPage  = () => Number(getCookie('fitnova_plansPerPage') || 5)

export const saveLastPage     = (page) => setCookie('fitnova_lastPage', page, 30)
export const getLastPage      = () => getCookie('fitnova_lastPage')

// ─── Plan Activity ──────────────────────────────────────
export const saveLastVisitedPlan  = (planId) => setCookie('fitnova_lastPlanId', planId, 30)
export const getLastVisitedPlan   = () => getCookie('fitnova_lastPlanId')

export function incrementPlansCreated() {
  const count = Number(getCookie('fitnova_plansCreated') || 0) + 1
  setCookie('fitnova_plansCreated', count, 365)
}
export const getPlansCreated = () => Number(getCookie('fitnova_plansCreated') || 0)

export function trackPageVisit(page) {
  if (!hasConsent()) return
  const count = Number(getCookie(`fitnova_visits_${page}`) || 0) + 1
  setCookie(`fitnova_visits_${page}`, count, 365)
}
export const getPageVisitCount = (page) => Number(getCookie(`fitnova_visits_${page}`) || 0)