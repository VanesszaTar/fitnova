const request = require('supertest')
const app = require('../server')
const { User, Plan, Exercise } = require('../models')
const bcrypt = require('bcryptjs')

let alexId

const createAlex = async () => {
  const alex = await User.create({
    firstName: 'Alex',
    lastName: 'Smith',
    age: 22,
    gender: 'Male',
    email: 'alex@example.com',
    password: bcrypt.hashSync('PAssword1!', 10)
  })
  alexId = alex.id
  return alex
}

beforeAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })
  await createAlex()
})

afterAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })
})

// ── REGISTER ──────────────────────────────────────────────
describe('POST /api/users/register', () => {

  const validUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    age: 25,
    gender: 'Female',
    email: 'jane@example.com',
    password: 'PAssword1!',
    confirmPassword: 'PAssword1!'
  }

  it('registers a new user with valid data', async () => {
    const res = await request(app).post('/api/users/register').send(validUser)
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('jane@example.com')
    expect(res.body.password).toBeUndefined()
    expect(res.body.token).toBeDefined()          // ← NEW: token must come back
    expect(typeof res.body.token).toBe('string')  // ← NEW: and it must be a string
  })

  it('fails when first name is empty', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, firstName: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.firstName).toBeDefined()
  })

  it('fails when first name has spaces', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, firstName: 'John Doe' })
    expect(res.status).toBe(400)
    expect(res.body.errors.firstName).toBeDefined()
  })

  it('fails when last name is empty', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, lastName: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.lastName).toBeDefined()
  })

  it('fails when last name has spaces', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, lastName: 'Van Berg' })
    expect(res.status).toBe(400)
    expect(res.body.errors.lastName).toBeDefined()
  })

  it('fails when age is missing', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, age: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.age).toBeDefined()
  })

  it('fails when age is not a number', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, age: 'abc' })
    expect(res.status).toBe(400)
    expect(res.body.errors.age).toBeDefined()
  })

  it('fails when age is under 14', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, age: 13 })
    expect(res.status).toBe(400)
    expect(res.body.errors.age).toBeDefined()
  })

  it('passes when age is exactly 14', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, age: 14, email: 'young@example.com' })
    expect(res.status).toBe(201)
  })

  it('fails when gender is missing', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, gender: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.gender).toBeDefined()
  })

  it('fails when email is empty', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, email: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.email).toBeDefined()
  })

  it('fails when email has no @', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, email: 'janeexample.com' })
    expect(res.status).toBe(400)
    expect(res.body.errors.email).toBeDefined()
  })

  it('fails when email does not end with .com', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, email: 'jane@example.ro' })
    expect(res.status).toBe(400)
    expect(res.body.errors.email).toBeDefined()
  })

  it('fails when email is already registered', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, email: 'alex@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.errors.email).toBeDefined()
  })

  it('fails when password is empty', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, password: '', confirmPassword: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.password).toBeDefined()
  })

  it('fails when password is too short', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, password: 'Pass1!', confirmPassword: 'Pass1!' })
    expect(res.status).toBe(400)
    expect(res.body.errors.password).toBeDefined()
  })

  it('fails when password has less than 2 uppercase letters', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, password: 'password1!a', confirmPassword: 'password1!a' })
    expect(res.status).toBe(400)
    expect(res.body.errors.password).toBeDefined()
  })

  it('fails when password has no digit', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, password: 'PAssword!!a', confirmPassword: 'PAssword!!a' })
    expect(res.status).toBe(400)
    expect(res.body.errors.password).toBeDefined()
  })

  it('fails when password has no special character', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, password: 'PAssword123', confirmPassword: 'PAssword123' })
    expect(res.status).toBe(400)
    expect(res.body.errors.password).toBeDefined()
  })

  it('fails when passwords do not match', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, confirmPassword: 'Different1!' })
    expect(res.status).toBe(400)
    expect(res.body.errors.confirmPassword).toBeDefined()
  })

  it('fails when confirm password is empty', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, confirmPassword: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.confirmPassword).toBeDefined()
  })

  it('fails when age is negative', async () => {
    const res = await request(app).post('/api/users/register').send({ ...validUser, age: -1 })
    expect(res.status).toBe(400)
    expect(res.body.errors.age).toBeDefined()
  })
})

// ── LOGIN ─────────────────────────────────────────────────
describe('POST /api/users/login', () => {

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'alex@example.com', password: 'PAssword1!' })
    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
    expect(res.body.token).toBeDefined()          // ← NEW: token must come back
    expect(typeof res.body.token).toBe('string')  // ← NEW: and it must be a string
  })

  it('fails when email is missing', async () => {
    const res = await request(app).post('/api/users/login').send({ email: '', password: 'PAssword1!' })
    expect(res.status).toBe(400)
  })

  it('fails when password is missing', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'alex@example.com', password: '' })
    expect(res.status).toBe(400)
  })

  it('fails with wrong password', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'alex@example.com', password: 'WrongPass1!' })
    expect(res.status).toBe(401)
  })

  it('fails with wrong email', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'wrong@example.com', password: 'PAssword1!' })
    expect(res.status).toBe(401)
  })
})

// ── GET ALL USERS ─────────────────────────────────────────
describe('GET /api/users', () => {

  it('returns paginated list of users', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.total).toBeDefined()
    expect(res.body.page).toBe(1)
    expect(res.body.totalPages).toBeDefined()
  })

  it('respects page and limit query params', async () => {
    const res = await request(app).get('/api/users?page=1&limit=1')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(1)
    expect(res.body.limit).toBe(1)
  })

  it('never returns passwords', async () => {
    const res = await request(app).get('/api/users')
    res.body.data.forEach(user => {
      expect(user.password).toBeUndefined()
    })
  })
})

// ── GET USER BY ID ────────────────────────────────────────
describe('GET /api/users/:id', () => {

  it('returns a user by id', async () => {
    const res = await request(app).get(`/api/users/${alexId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(alexId)
    expect(res.body.password).toBeUndefined()
  })

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/9999')
    expect(res.status).toBe(404)
  })
})

// ── UPDATE USER ───────────────────────────────────────────
describe('PUT /api/users/:id', () => {

  const updatedData = {
    firstName: 'Alex',
    lastName: 'Updated',
    age: 25,
    gender: 'Male',
    email: 'alex@example.com',
    password: 'PAssword1!'
  }

  it('updates a user successfully', async () => {
    const res = await request(app).put(`/api/users/${alexId}`).send(updatedData)
    expect(res.status).toBe(200)
    expect(res.body.lastName).toBe('Updated')
  })

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).put('/api/users/9999').send(updatedData)
    expect(res.status).toBe(404)
  })

  it('fails with invalid data', async () => {
    const res = await request(app).put(`/api/users/${alexId}`).send({ ...updatedData, firstName: '' })
    expect(res.status).toBe(400)
  })

  it('updates a user without password field', async () => {
    const res = await request(app).put(`/api/users/${alexId}`).send({
      firstName: 'Alex',
      lastName: 'Smith',
      age: 22,
      gender: 'Male',
      email: 'alex@example.com'
    })
    expect(res.status).toBe(200)
  })
})

// ── DELETE USER ───────────────────────────────────────────
describe('DELETE /api/users/:id', () => {

  it('deletes a user successfully', async () => {
    const created = await request(app).post('/api/users/register').send({
      firstName: 'ToDelete',
      lastName: 'User',
      age: 20,
      gender: 'Male',
      email: 'todelete@example.com',
      password: 'PAssword1!',
      confirmPassword: 'PAssword1!'
    })
    const res = await request(app).delete(`/api/users/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('User deleted successfully')
  })

  it('returns 404 for non-existent user', async () => {
    const res = await request(app).delete('/api/users/9999')
    expect(res.status).toBe(404)
  })
})

// ── STATS ─────────────────────────────────────────────────
describe('GET /api/users/stats/summary', () => {

  it('returns user statistics', async () => {
    const res = await request(app).get('/api/users/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.totalUsers).toBeDefined()
    expect(res.body.averageAge).toBeDefined()
    expect(res.body.genderDistribution).toBeDefined()
  })

  it('returns 0 average age when no users exist', async () => {
    await Exercise.destroy({ where: {} })
    await Plan.destroy({ where: {} })
    await User.destroy({ where: {} })
    const res = await request(app).get('/api/users/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.averageAge).toBe(0)
    await createAlex()
  })
})

// ── HEALTH ────────────────────────────────────────────────
describe('GET /api/health', () => {

  it('returns health check message', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('FitNova API is running')
  })
})

// ── 404 ───────────────────────────────────────────────────
describe('404 handler', () => {

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Route not found')
  })
})

// ── 500 ERROR HANDLERS ───────────────────────────────────
describe('500 error handlers', () => {

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('GET /api/users returns 500 on db error', async () => {
    jest.spyOn(User, 'findAndCountAll').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(500)
  })

  it('GET /api/users/:id returns 500 on db error', async () => {
    jest.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get(`/api/users/${alexId}`)
    expect(res.status).toBe(500)
  })

  it('POST /api/users/register returns 500 on db error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).post('/api/users/register').send({
      firstName: 'Test',
      lastName: 'User',
      age: 25,
      gender: 'Male',
      email: 'test500@example.com',
      password: 'PAssword1!',
      confirmPassword: 'PAssword1!'
    })
    expect(res.status).toBe(500)
  })

  it('POST /api/users/login returns 500 on db error', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).post('/api/users/login').send({
      email: 'alex@example.com',
      password: 'PAssword1!'
    })
    expect(res.status).toBe(500)
  })

  it('PUT /api/users/:id returns 500 on db error', async () => {
    jest.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).put(`/api/users/${alexId}`).send({
      firstName: 'Alex',
      lastName: 'Smith',
      age: 22,
      gender: 'Male',
      email: 'alex@example.com',
      password: 'PAssword1!'
    })
    expect(res.status).toBe(500)
  })

  it('DELETE /api/users/:id returns 500 on db error', async () => {
    jest.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).delete(`/api/users/${alexId}`)
    expect(res.status).toBe(500)
  })

  it('GET /api/users/stats/summary returns 500 on db error', async () => {
    jest.spyOn(User, 'findAll').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/api/users/stats/summary')
    expect(res.status).toBe(500)
  })
})