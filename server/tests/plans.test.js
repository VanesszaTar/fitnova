const request = require('supertest')
const app = require('../server')
const { User, Plan, Exercise } = require('../models')
const bcrypt = require('bcryptjs')

let userId
let planId

beforeAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })

  const user = await User.create({
    firstName: 'Alex',
    lastName: 'Smith',
    age: 22,
    gender: 'Male',
    email: 'alex@example.com',
    password: bcrypt.hashSync('PAssword1!', 10)
  })
  userId = user.id

  const plan = await Plan.create({
    name: 'Push Day A',
    description: 'Chest, shoulders and triceps focus',
    status: 'Active',
    created: '2026-03-01',
    userId
  })
  planId = plan.id

  await Exercise.bulkCreate([
    { name: 'Bench Press', muscle: 'Chest', sets: 4, reps: 10, rest: 2, met: 6.0, planId },
    { name: 'Overhead Press', muscle: 'Shoulders', sets: 4, reps: 8, rest: 2, met: 5.5, planId }
  ])

  await Plan.create({ name: 'Pull Day', description: 'Back and biceps', status: 'Inactive', created: '2026-02-22', userId })
  await Plan.create({ name: 'Leg Day', description: 'Quads and hamstrings', status: 'Inactive', created: '2026-02-15', userId })
})

afterAll(async () => {
  await Exercise.destroy({ where: {} })
  await Plan.destroy({ where: {} })
  await User.destroy({ where: {} })
})

// ── GET ALL PLANS ─────────────────────────────────────────
describe('GET /api/plans', () => {

  it('returns paginated list of plans', async () => {
    const res = await request(app).get('/api/plans')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    expect(res.body.page).toBe(1)
    expect(res.body.totalPages).toBeDefined()
  })

  it('respects page and limit query params', async () => {
    const res = await request(app).get('/api/plans?page=1&limit=2')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(2)
    expect(res.body.limit).toBe(2)
  })

  it('filters by Active status', async () => {
    const res = await request(app).get('/api/plans?status=Active')
    expect(res.status).toBe(200)
    res.body.data.forEach(plan => {
      expect(plan.status).toBe('Active')
    })
  })

  it('filters by Inactive status', async () => {
    const res = await request(app).get('/api/plans?status=Inactive')
    expect(res.status).toBe(200)
    res.body.data.forEach(plan => {
      expect(plan.status).toBe('Inactive')
    })
  })

  it('returns all plans when no filter is applied', async () => {
    const res = await request(app).get('/api/plans?limit=100')
    expect(res.status).toBe(200)
    expect(res.body.total).toBeGreaterThanOrEqual(3)
  })
})

// ── GET PLAN BY ID ────────────────────────────────────────
describe('GET /api/plans/:id', () => {

  it('returns a plan by id', async () => {
    const res = await request(app).get(`/api/plans/${planId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(planId)
    expect(res.body.name).toBe('Push Day A')
  })

  it('returns 404 for non-existent plan', async () => {
    const res = await request(app).get('/api/plans/9999')
    expect(res.status).toBe(404)
  })
})

// ── POST /api/plans ───────────────────────────────────────
describe('POST /api/plans', () => {

  const validPlan = {
    name: 'New Plan',
    description: 'A brand new plan',
    userId: 1,
    exercises: [
      { name: 'Squat', muscle: 'Legs', sets: 4, reps: 10, rest: 2, met: 6.0 }
    ]
  }

  it('creates a new plan with valid data', async () => {
    const res = await request(app).post('/api/plans').send({ ...validPlan, userId })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('New Plan')
    expect(res.body.exercises.length).toBe(1)
  })

  it('creates a plan without exercises', async () => {
    const res = await request(app).post('/api/plans').send({ name: 'Empty Plan', description: 'No exercises yet', userId })
    expect(res.status).toBe(201)
    expect(res.body.exercises.length).toBe(0)
  })

  it('fails when name is empty', async () => {
    const res = await request(app).post('/api/plans').send({ ...validPlan, name: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.name).toBeDefined()
  })

  it('fails when description is empty', async () => {
    const res = await request(app).post('/api/plans').send({ ...validPlan, description: '' })
    expect(res.status).toBe(400)
    expect(res.body.errors.description).toBeDefined()
  })

  it('fails when exercise sets is 0', async () => {
    const res = await request(app).post('/api/plans').send({
      ...validPlan,
      exercises: [{ name: 'Squat', muscle: 'Legs', sets: 0, reps: 10, rest: 2, met: 6.0 }]
    })
    expect(res.status).toBe(400)
  })

  it('fails when exercise reps is 0', async () => {
    const res = await request(app).post('/api/plans').send({
      ...validPlan,
      exercises: [{ name: 'Squat', muscle: 'Legs', sets: 4, reps: 0, rest: 2, met: 6.0 }]
    })
    expect(res.status).toBe(400)
  })

  it('fails when exercise met is 0', async () => {
    const res = await request(app).post('/api/plans').send({
      ...validPlan,
      exercises: [{ name: 'Squat', muscle: 'Legs', sets: 4, reps: 10, rest: 2, met: 0 }]
    })
    expect(res.status).toBe(400)
  })

  it('fails when exercise name is empty', async () => {
    const res = await request(app).post('/api/plans').send({
      ...validPlan,
      exercises: [{ name: '', muscle: 'Legs', sets: 4, reps: 10, rest: 2, met: 6.0 }]
    })
    expect(res.status).toBe(400)
  })

  it('fails when exercises is not an array', async () => {
    const res = await request(app).post('/api/plans').send({
      name: 'Test Plan',
      description: 'Test description',
      userId,
      exercises: 'not an array'
    })
    expect(res.status).toBe(400)
    expect(res.body.errors.exercises).toBeDefined()
  })

  it('fails when exercise rest is negative', async () => {
    const res = await request(app).post('/api/plans').send({
      name: 'Test Plan',
      description: 'Test description',
      userId,
      exercises: [{ name: 'Squat', muscle: 'Legs', sets: 4, reps: 10, rest: -1, met: 6.0 }]
    })
    expect(res.status).toBe(400)
  })

  it('creates a plan with no userId defaults to 1', async () => {
    const res = await request(app).post('/api/plans').send({
      name: 'No User Plan',
      description: 'Plan without userId',
      exercises: []
    })
    expect(res.status).toBe(201)
    expect(res.body.userId).toBe(1)
  })

  it('creates a plan with empty exercises array', async () => {
    const res = await request(app).post('/api/plans').send({
      name: 'Empty Exercises Plan',
      description: 'Plan with empty exercises array',
      userId,
      exercises: []
    })
    expect(res.status).toBe(201)
    expect(res.body.exercises.length).toBe(0)
  })

  it('skips bulkCreate when exercises array is empty', async () => {
    const res = await request(app).post('/api/plans').send({
      name: 'Skip BulkCreate Plan',
      description: 'Should skip bulkCreate',
      userId,
      exercises: []
    })
    expect(res.status).toBe(201)
    expect(res.body.exercises).toEqual([])
  })
})

// ── PUT /api/plans/:id ────────────────────────────────────
describe('PUT /api/plans/:id', () => {
  it('updates a plan with empty exercises array clears all exercises', async () => {
    const res = await request(app).put(`/api/plans/${planId}`).send({
      name: 'Updated Plan',
      description: 'Updated description',
      exercises: []   // exercises is defined but empty — hits the false branch of line 180
    })
    expect(res.status).toBe(200)
    expect(res.body.exercises).toEqual([])
  })
  
  it('updates a plan successfully', async () => {
    const res = await request(app).put(`/api/plans/${planId}`).send({
      name: 'Updated Plan',
      description: 'Updated description'
    })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated Plan')
  })

  it('updates exercises when provided', async () => {
    const res = await request(app).put(`/api/plans/${planId}`).send({
      name: 'Updated Plan',
      description: 'Updated description',
      exercises: [{ name: 'Squat', muscle: 'Legs', sets: 4, reps: 10, rest: 2, met: 6.0 }]
    })
    expect(res.status).toBe(200)
    expect(res.body.exercises.length).toBe(1)
  })

  it('returns 404 for non-existent plan', async () => {
    const res = await request(app).put('/api/plans/9999').send({ name: 'X', description: 'Y' })
    expect(res.status).toBe(404)
  })

  it('fails when name is empty', async () => {
    const res = await request(app).put(`/api/plans/${planId}`).send({ name: '', description: 'desc' })
    expect(res.status).toBe(400)
  })

  it('fails when description is empty', async () => {
    const res = await request(app).put(`/api/plans/${planId}`).send({ name: 'name', description: '' })
    expect(res.status).toBe(400)
  })
})

// ── DELETE /api/plans/:id ─────────────────────────────────
describe('DELETE /api/plans/:id', () => {

  it('deletes a plan successfully', async () => {
    const created = await request(app).post('/api/plans').send({
      name: 'To Delete',
      description: 'Will be deleted',
      userId
    })
    const res = await request(app).delete(`/api/plans/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Plan deleted successfully')
  })

  it('returns 404 for non-existent plan', async () => {
    const res = await request(app).delete('/api/plans/9999')
    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/plans/:id/activate ────────────────────────
describe('PATCH /api/plans/:id/activate', () => {

  it('activates a plan and deactivates others', async () => {
  await Plan.update({ status: 'Inactive' }, { where: {} })
  const res = await request(app).patch(`/api/plans/${planId}/activate`)
  expect(res.status).toBe(200)
  expect(res.body.status).toBe('Active')
})

  it('returns 404 for non-existent plan', async () => {
    const res = await request(app).patch('/api/plans/9999/activate')
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/plans/:id/exercises/:exerciseId ───────────
describe('DELETE /api/plans/:id/exercises/:exerciseId', () => {

  it('removes an exercise from a plan', async () => {
    const plan = await request(app).get(`/api/plans/${planId}`)
    const exerciseId = plan.body.exercises[0]?.id
    if (!exerciseId) return
    const res = await request(app).delete(`/api/plans/${planId}/exercises/${exerciseId}`)
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent plan', async () => {
    const res = await request(app).delete('/api/plans/9999/exercises/1')
    expect(res.status).toBe(404)
  })

  it('returns 404 for non-existent exercise', async () => {
    const res = await request(app).delete(`/api/plans/${planId}/exercises/9999`)
    expect(res.status).toBe(404)
  })
})

// ── GET /api/plans/exercises/available ───────────────────
describe('GET /api/plans/exercises/available', () => {

  it('returns list of available exercises', async () => {
    const res = await request(app).get('/api/plans/exercises/available')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(25)
  })

  it('each exercise has id, name and muscle', async () => {
    const res = await request(app).get('/api/plans/exercises/available')
    res.body.forEach(ex => {
      expect(ex.id).toBeDefined()
      expect(ex.name).toBeDefined()
      expect(ex.muscle).toBeDefined()
    })
  })
})

// ── GET /api/plans/stats/summary ─────────────────────────
describe('GET /api/plans/stats/summary', () => {
  it('returns plan statistics', async () => {
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.totalPlans).toBeDefined()
    expect(res.body.activePlan).toBeDefined()
    expect(res.body.totalExercises).toBeDefined()
    expect(res.body.totalSets).toBeDefined()
    expect(res.body.plansWithScore).toBeDefined()
    expect(res.body.muscleDistribution).toBeDefined()
  })

  it('plansWithScore is sorted by score descending', async () => {
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    const scores = res.body.plansWithScore.map(p => p.score)
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1])
    }
  })

  it('muscleDistribution percentages add up to 100', async () => {
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    if (res.body.muscleDistribution.length > 0) {
      const total = res.body.muscleDistribution.reduce((sum, m) => sum + m.percentage, 0)
      expect(total).toBeGreaterThanOrEqual(99)
    }
  })

  it('returns null activePlan when no plan is active', async () => {
    await Plan.update({ status: 'Inactive' }, { where: {} })
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.activePlan).toBeNull()
  })

  it('returns 0 totalExercises when plans have no exercises', async () => {
    await Exercise.destroy({ where: {} })
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.totalExercises).toBe(0)
    expect(res.body.muscleDistribution).toEqual([])
  })

  it('returns null highestComplexity when no plans exist', async () => {
    await Exercise.destroy({ where: {} })
    await Plan.destroy({ where: {} })
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(200)
    expect(res.body.highestComplexity).toBeNull()
  })
})

// ── 500 ERROR HANDLERS ───────────────────────────────────
describe('500 error handlers', () => {

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('GET /api/plans returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findAndCountAll').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/api/plans')
    expect(res.status).toBe(500)
  })

  it('GET /api/plans/:id returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get(`/api/plans/${planId}`)
    expect(res.status).toBe(500)
  })

  it('POST /api/plans returns 500 on db error', async () => {
    jest.spyOn(Plan, 'create').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).post('/api/plans').send({
      name: 'Test Plan',
      description: 'Test',
      userId
    })
    expect(res.status).toBe(500)
  })

  it('PUT /api/plans/:id returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).put(`/api/plans/${planId}`).send({
      name: 'Updated',
      description: 'Updated'
    })
    expect(res.status).toBe(500)
  })

  it('DELETE /api/plans/:id returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).delete(`/api/plans/${planId}`)
    expect(res.status).toBe(500)
  })

  it('PATCH /api/plans/:id/activate returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).patch(`/api/plans/${planId}/activate`)
    expect(res.status).toBe(500)
  })

  it('DELETE /api/plans/:id/exercises/:exerciseId returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findByPk').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).delete(`/api/plans/${planId}/exercises/1`)
    expect(res.status).toBe(500)
  })

  it('GET /api/plans/stats/summary returns 500 on db error', async () => {
    jest.spyOn(Plan, 'findAll').mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/api/plans/stats/summary')
    expect(res.status).toBe(500)
  })
})