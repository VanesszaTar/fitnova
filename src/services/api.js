import { BASE_URL } from '../config'
const GRAPHQL_URL = `${BASE_URL}/api/graphql`

// ── Token storage ──────────────────────────────────────────────────────────
let authToken = null

export function setToken(token) {
  authToken = token
}

export function clearToken() {
  authToken = null
}

export function getToken() {
  return authToken
}

// ── Refresh the access token using the httpOnly cookie ─────────────────────
export async function refreshAccessToken() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      return true
    }
    return false
  } catch {
    return false
  }
}

// ── Core GraphQL helper ────────────────────────────────────────────────────
async function gql(query, variables = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json' }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ query, variables })
  })

  const data = await res.json()

  // If token expired, try to refresh once then retry
  if (data.errors?.[0]?.message?.includes('expired') && retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return gql(query, variables, false)
    }
  }

  if (data.errors) throw new Error(data.errors[0].message)
  return data.data
}

// ── Auth ───────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const data = await gql(`
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        user { id firstName lastName email age height weight fitnessLevel goal roleId role { id name } }
        message
        token
        requiresTwoFactor
        userId
      }
    }
  `, { email, password })
  return data.login
}

export async function registerUser(formData) {
  const data = await gql(`
    mutation Register(
      $firstName: String!, $lastName: String!, $email: String!, $password: String!, $confirmPassword: String!,
      $age: Int!, $gender: String!, $height: Float, $weight: Float, $fitnessLevel: String, $goal: String,
      $securityQuestion: String!, $securityAnswer: String!
    ) {
      register(
        firstName: $firstName, lastName: $lastName, email: $email, password: $password, confirmPassword: $confirmPassword,
        age: $age, gender: $gender, height: $height, weight: $weight, fitnessLevel: $fitnessLevel, goal: $goal,
        securityQuestion: $securityQuestion, securityAnswer: $securityAnswer
      ) {
        user { id firstName lastName email roleId role { id name } }
        message
        token
      }
    }
  `, formData)
  return data.register
}

// ── 2FA ────────────────────────────────────────────────────────────────────
export async function sendTwoFactorCode(userId) {
  const res = await fetch(`${BASE_URL}/api/auth/send-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to send code')
  return data
}

export async function verifyTwoFactorCode(userId, code) {
  const res = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Invalid code')
  return data // { tempToken, securityQuestion }
}

export async function verifySecurityAnswer(tempToken, answer) {
  const res = await fetch(`${BASE_URL}/api/auth/verify-security`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // needed to receive the refresh token cookie
    body: JSON.stringify({ tempToken, answer })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Incorrect answer')
  return data // { user, token, message }
}

// ── Plans ──────────────────────────────────────────────────────────────────
export async function fetchPlans(page = 1, limit = 5, userId = null) {
  const data = await gql(`
    query FetchPlans($page: Int, $limit: Int, $userId: Int) {
      plans(page: $page, limit: $limit, userId: $userId) {
        data {
          id name description status created userId
          exercises { id name muscle sets reps rest met }
          user { id firstName lastName email }
        }
        total page limit totalPages
      }
    }
  `, { page, limit, userId })
  return data.plans
}

export async function createPlan(plan, userId) {
  const data = await gql(`
    mutation CreatePlan($name: String!, $description: String!, $userId: Int!, $exercises: [ExerciseInput]) {
      createPlan(name: $name, description: $description, userId: $userId, exercises: $exercises) {
        id name description status created userId
        exercises { id name muscle sets reps rest met }
        user { id firstName lastName email }
      }
    }
  `, { name: plan.name, description: plan.description, userId: plan.userId, exercises: plan.exercises })
  return data.createPlan
}

export async function updatePlan(id, plan) {
  const data = await gql(`
    mutation UpdatePlan($id: Int!, $name: String!, $description: String!, $exercises: [ExerciseInput]) {
      updatePlan(id: $id, name: $name, description: $description, exercises: $exercises) {
        id name description status created
        exercises { id name muscle sets reps rest met }
      }
    }
  `, { id, name: plan.name, description: plan.description, exercises: plan.exercises })
  return data.updatePlan
}

export async function deletePlan(id) {
  const data = await gql(`
    mutation DeletePlan($id: Int!) {
      deletePlan(id: $id) { message }
    }
  `, { id })
  return data.deletePlan
}

export async function activatePlan(id) {
  const data = await gql(`
    mutation ActivatePlan($id: Int!) {
      activatePlan(id: $id) { id name status }
    }
  `, { id })
  return data.activatePlan
}

export async function fetchAvailableExercises() {
  const data = await gql(`
    query {
      availableExercises { id name muscle }
    }
  `)
  return data.availableExercises
}

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/api/health`)
  return res.ok
}