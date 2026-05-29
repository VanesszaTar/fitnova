const request = require('supertest')
const app = require('../server')
const { User, Plan, Exercise, Role } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ── Helper — recreate auth test user ───────────────────────
async function createAuthUser() {
  await User.destroy({ where: { email: 'auth@example.com' } })
  const userRole = await Role.findOne({ where: { name: 'user' } })
  await User.create({
    firstName: 'Auth',
    lastName: 'Tester',
    age: 25,
    gender: 'Male',
    email: 'auth@example.com',
    password: bcrypt.hashSync('PAssword1!', 10),
    roleId: userRole ? userRole.id : null
  })
}

// ── Setup ──────────────────────────────────────────────────
beforeAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })
  await createAuthUser()
})

afterAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })
})

// ── LOGIN returns a valid JWT ──────────────────────────────
describe('JWT — login', () => {

  it('returns a token on successful login', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(typeof res.body.token).toBe('string')
  })

  it('token contains correct userId and role', async () => {
    await createAuthUser()
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded.userId).toBeDefined()
    expect(decoded.role).toBeDefined()
  })

  it('does not return a token on wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'WrongPass1!' })
    expect(res.status).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  it('does not return a token when email not found', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'nobody@example.com', password: 'PAssword1!' })
    expect(res.status).toBe(401)
    expect(res.body.token).toBeUndefined()
  })
})

// ── REGISTER returns a valid JWT ───────────────────────────
describe('JWT — register', () => {

  it('returns a token on successful registration', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        firstName: 'New',
        lastName: 'User',
        age: 20,
        gender: 'Female',
        email: 'newuser@example.com',
        password: 'PAssword1!',
        confirmPassword: 'PAssword1!'
      })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(typeof res.body.token).toBe('string')
  })

  it('does not return a token on failed registration', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        firstName: '',
        lastName: 'User',
        age: 20,
        gender: 'Female',
        email: 'fail@example.com',
        password: 'PAssword1!',
        confirmPassword: 'PAssword1!'
      })
    expect(res.status).toBe(400)
    expect(res.body.token).toBeUndefined()
  })
})

// ── TOKEN VERIFICATION ─────────────────────────────────────
describe('JWT — token verification', () => {

  let validToken

  beforeAll(async () => {
    await createAuthUser()
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    validToken = res.body.token
  })

  it('accepts a valid token', async () => {
    const decoded = jwt.verify(validToken, process.env.JWT_SECRET)
    expect(decoded.userId).toBeDefined()
    expect(decoded.role).toBeDefined()
  })

  it('rejects a tampered token', async () => {
    const tampered = validToken.slice(0, -5) + 'XXXXX'
    expect(() => jwt.verify(tampered, process.env.JWT_SECRET)).toThrow()
  })

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: 1, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    )
    expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET)).toThrow('jwt expired')
  })

  it('rejects a token signed with a different secret', async () => {
    const fakeToken = jwt.sign(
      { userId: 1, role: 'user' },
      'completely_wrong_secret',
      { expiresIn: '15m' }
    )
    expect(() => jwt.verify(fakeToken, process.env.JWT_SECRET)).toThrow()
  })

  it('valid token has not expired', async () => {
    const decoded = jwt.verify(validToken, process.env.JWT_SECRET)
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})

// ── TOKEN STRUCTURE ────────────────────────────────────────
describe('JWT — token structure', () => {

  beforeAll(async () => {
    await createAuthUser()
  })

  it('token has three parts separated by dots', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    const parts = res.body.token.split('.')
    expect(parts.length).toBe(3)
  })

  it('token payload contains userId and role', async () => {
    await createAuthUser()
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded).toHaveProperty('userId')
    expect(decoded).toHaveProperty('role')
  })

  it('token does not contain the password', async () => {
    await createAuthUser()
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded.password).toBeUndefined()
  })

  it('two logins produce different tokens', async () => {
    const res1 = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    await new Promise(r => setTimeout(r, 1100))
    const res2 = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })
    expect(res1.body.token).not.toBe(res2.body.token)
  })
})

// ── FALLBACK EXPIRY ────────────────────────────────────────
describe('JWT — fallback expiry when JWT_EXPIRES_IN is not set', () => {

  beforeAll(async () => {
    await createAuthUser()
  })

  it('login still returns a token when JWT_EXPIRES_IN is not set', async () => {
    const original = process.env.JWT_EXPIRES_IN
    const originalRefresh = process.env.REFRESH_TOKEN_EXPIRES_IN
    delete process.env.JWT_EXPIRES_IN
    delete process.env.REFRESH_TOKEN_EXPIRES_IN

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'auth@example.com', password: 'PAssword1!' })

    process.env.JWT_EXPIRES_IN = original
    process.env.REFRESH_TOKEN_EXPIRES_IN = originalRefresh

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(typeof res.body.token).toBe('string')
  })

  it('register still returns a token when JWT_EXPIRES_IN is not set', async () => {
    const original = process.env.JWT_EXPIRES_IN
    const originalRefresh = process.env.REFRESH_TOKEN_EXPIRES_IN
    delete process.env.JWT_EXPIRES_IN
    delete process.env.REFRESH_TOKEN_EXPIRES_IN

    const res = await request(app)
      .post('/api/users/register')
      .send({
        firstName: 'Fallback',
        lastName: 'User',
        age: 22,
        gender: 'Male',
        email: 'fallback@example.com',
        password: 'PAssword1!',
        confirmPassword: 'PAssword1!'
      })

    process.env.JWT_EXPIRES_IN = original
    process.env.REFRESH_TOKEN_EXPIRES_IN = originalRefresh

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(typeof res.body.token).toBe('string')
  })
})