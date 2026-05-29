import { BASE_URL } from '../config'

let isOnline = true
let listeners = []
let intervalId = null

function notify(status) {
  listeners.forEach(fn => fn(status))
}

async function checkConnection() {
  if (!navigator.onLine) {
    if (isOnline) {
      isOnline = false
      notify(false)
    }
    return
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${BASE_URL}/api/health`, {
      signal: controller.signal
    })
    clearTimeout(timeout)
    const reachable = res.ok
    if (reachable !== isOnline) {
      isOnline = reachable
      notify(isOnline)
    }
  } catch (err) {
    if (isOnline) {
      isOnline = false
      notify(false)
    }
  }
}

export function startNetworkMonitor() {
  window.addEventListener('online', () => {
    isOnline = true
    notify(true)
    checkConnection()
  })
  window.addEventListener('offline', () => {
    isOnline = false
    notify(false)
  })
  checkConnection()
  intervalId = setInterval(checkConnection, 5000)
}

export function stopNetworkMonitor() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function onNetworkChange(fn) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter(l => l !== fn)
  }
}

export function getIsOnline() {
  return isOnline
}