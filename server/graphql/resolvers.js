'use strict'
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { faker } = require('@faker-js/faker')
const { User, Plan, Exercise, Role, Permission, UserLog, RefreshToken } = require('../models')
const { Op } = require('sequelize')
const logAction = require('../utils/userLogger')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))

const availableExercises = [
  { id: 1, name: 'Bench Press', muscle: 'Chest' },
  { id: 2, name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { id: 3, name: 'Cable Fly', muscle: 'Chest' },
  { id: 4, name: 'Overhead Press', muscle: 'Shoulders' },
  { id: 5, name: 'Lateral Raises', muscle: 'Shoulders' },
  { id: 6, name: 'Front Raises', muscle: 'Shoulders' },
  { id: 7, name: 'Pull Ups', muscle: 'Back' },
  { id: 8, name: 'Barbell Row', muscle: 'Back' },
  { id: 9, name: 'Lat Pulldown', muscle: 'Back' },
  { id: 10, name: 'Deadlift', muscle: 'Back' },
  { id: 11, name: 'Squat', muscle: 'Legs' },
  { id: 12, name: 'Leg Press', muscle: 'Legs' },
  { id: 13, name: 'Romanian Deadlift', muscle: 'Legs' },
  { id: 14, name: 'Leg Curl', muscle: 'Legs' },
  { id: 15, name: 'Calf Raises', muscle: 'Legs' },
  { id: 16, name: 'Tricep Pushdown', muscle: 'Triceps' },
  { id: 17, name: 'Skull Crushers', muscle: 'Triceps' },
  { id: 18, name: 'Dips', muscle: 'Triceps' },
  { id: 19, name: 'Bicep Curl', muscle: 'Biceps' },
  { id: 20, name: 'Hammer Curl', muscle: 'Biceps' },
  { id: 21, name: 'Plank', muscle: 'Core' },
  { id: 22, name: 'Crunches', muscle: 'Core' },
  { id: 23, name: 'Leg Raises', muscle: 'Core' },
  { id: 24, name: 'Burpees', muscle: 'Full Body' },
  { id: 25, name: 'Mountain Climbers', muscle: 'Full Body' }
]

const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Full Body']
const fitnessAdjectives = ['Power', 'Elite', 'Ultimate', 'Intense', 'Dynamic', 'Advanced', 'Explosive', 'Endurance', 'Strength', 'Athletic', 'Heavy', 'Max', 'Hypertrophy', 'Functional', 'Compound', 'Metabolic', 'Cardio', 'Speed']
const fitnessNouns = ['Push', 'Pull', 'Squat', 'Press', 'Deadlift', 'Burn', 'Blast', 'Circuit', 'Split', 'Session', 'Grind', 'Drive', 'Build', 'Shred', 'Pump', 'Flow', 'Force', 'Storm', 'Rush', 'Surge']
const fitnessExerciseAdjectives = ['Heavy', 'Slow', 'Fast', 'Wide', 'Close', 'Reverse', 'Seated', 'Standing', 'Incline', 'Decline', 'Weighted', 'Assisted', 'Single', 'Double', 'Explosive', 'Paused', 'Tempo', 'Strict', 'Loaded']
const fitnessExerciseNouns = ['Press', 'Row', 'Curl', 'Raise', 'Fly', 'Pulldown', 'Extension', 'Squat', 'Lunge', 'Deadlift', 'Pushdown', 'Crunch', 'Plank', 'Dip', 'Shrug', 'Swing', 'Carry', 'Hold', 'Pull', 'Thrust']
const fitnessDescriptions = [
  'Focus on progressive overload with compound movements.',
  'High volume session targeting muscle hypertrophy.',
  'Strength-focused training with heavy compound lifts.',
  'Metabolic conditioning with supersets and minimal rest.',
  'Full range of motion exercises for maximum muscle activation.',
  'Explosive movements combined with controlled negatives.',
  'Endurance-based training to build muscular stamina.',
  'Isolation exercises to target specific muscle groups.',
  'Push your limits with this high intensity workout.',
  'Balanced training session for overall fitness development.'
]

let generatorInterval = null
let isRunning = false

// ── Auth guard ────────────────────────────────────────────────────────────
function requireUser(context) {
  if (context.tokenExpired) throw new Error('jwt expired')
  if (!context.userId) throw new Error('Unauthorized')
}

function validateUserData({ firstName, lastName, email, password, confirmPassword, age, gender }) {
  const errors = []
  if (!firstName || firstName.trim() === '') errors.push('First name is required')
  else if (/\s/.test(firstName)) errors.push('First name must not contain spaces')
  if (!lastName || lastName.trim() === '') errors.push('Last name is required')
  else if (/\s/.test(lastName)) errors.push('Last name must not contain spaces')
  if (!age || isNaN(age)) errors.push('Age must be a number')
  else if (Number(age) < 14) errors.push('User must be 14 or older')
  if (!gender || gender.trim() === '') errors.push('Gender is required')
  if (!email || email.trim() === '') errors.push('Email is required')
  else if (!email.includes('@') || !email.endsWith('.com')) errors.push('Email must contain @ and end with .com')
  if (!password || password === '') errors.push('Password is required')
  else if (password.length < 10) errors.push('Password must be at least 10 characters')
  else if ((password.match(/[A-Z]/g) || []).length < 2) errors.push('Password must contain at least 2 uppercase letters')
  else if (!/\d/.test(password)) errors.push('Password must contain at least 1 digit')
  else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least 1 special character')
  if (confirmPassword === undefined || confirmPassword === '') errors.push('Please confirm your password')
  else if (password !== confirmPassword) errors.push('Passwords do not match')
  return errors
}

function validatePlanData(name, description) {
  if (!name || name.trim() === '') throw new Error('Plan name is required')
  if (!description || description.trim() === '') throw new Error('Description is required')
}

async function issueRefreshToken(userId, role, permissions, res) {
  const refreshToken = jwt.sign(
    { userId, role, permissions },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })
  if (res) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  }
}

const resolvers = {

  // ── Queries ──────────────────────────────────────────────────────────────

  plans: async ({ page = 1, limit = 12, status, userId }) => {
    const p = Math.max(1, page)
    const l = Math.max(1, limit)
    const where = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    const { count, rows } = await Plan.findAndCountAll({
      where,
      include: [
        { model: Exercise, as: 'exercises' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ],
      limit: l,
      offset: (p - 1) * l,
      order: [['createdAt', 'DESC']]
    })
    return { data: rows, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) }
  },

  plan: async ({ id }) => {
    const plan = await Plan.findByPk(id, {
      include: [
        { model: Exercise, as: 'exercises' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    })
    if (!plan) throw new Error('Plan not found')
    return plan
  },

  availableExercises: () => availableExercises,

  planStats: async ({ userId }) => {
    const where = userId ? { userId } : {}
    const plans = await Plan.findAll({
      where,
      include: [{ model: Exercise, as: 'exercises' }]
    })
    const totalPlans = plans.length
    const totalExercises = plans.reduce((sum, p) => sum + p.exercises.length, 0)
    const totalSets = plans.reduce((sum, p) =>
      sum + p.exercises.reduce((s, e) => s + e.sets, 0), 0)
    const plansWithScore = plans.map(p => {
      const avgSets = p.exercises.length
        ? p.exercises.reduce((s, e) => s + e.sets, 0) / p.exercises.length : 0
      const avgMet = p.exercises.length
        ? p.exercises.reduce((s, e) => s + e.met, 0) / p.exercises.length : 0
      const score = Math.round(p.exercises.length * avgSets * avgMet * 10) / 10
      const planTotalSets = p.exercises.reduce((s, e) => s + e.sets, 0)
      const planAvgMet = p.exercises.length
        ? Math.round(p.exercises.reduce((s, e) => s + e.met, 0) / p.exercises.length * 10) / 10 : 0
      return { id: p.id, name: p.name, status: p.status, score, totalSets: planTotalSets, avgMet: planAvgMet, exerciseCount: p.exercises.length }
    }).sort((a, b) => b.score - a.score)
    const muscleMap = {}
    plans.forEach(p => {
      p.exercises.forEach(e => {
        const muscle = e.muscle.split('·')[0].trim()
        muscleMap[muscle] = (muscleMap[muscle] || 0) + 1
      })
    })
    const totalMuscleCount = Object.values(muscleMap).reduce((a, b) => a + b, 0) || 1
    const muscleDistribution = Object.entries(muscleMap).map(([name, count]) => ({
      name, count, percentage: Math.round(count / totalMuscleCount * 100)
    }))
    return { totalPlans, totalExercises, totalSets, muscleDistribution, plansWithScore }
  },

  users: async ({ page = 1, limit = 10 }) => {
    const p = Math.max(1, page)
    const l = Math.max(1, limit)
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      limit: l,
      offset: (p - 1) * l
    })
    return users
  },

  user: async ({ id }) => {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Plan, as: 'plans', include: [{ model: Exercise, as: 'exercises' }] }]
    })
    if (!user) throw new Error('User not found')
    return user
  },

  userStats: async () => {
    const users = await User.findAll()
    const totalUsers = users.length
    const averageAge = users.length
      ? Math.round(users.reduce((sum, u) => sum + (u.age || 0), 0) / users.length * 10) / 10 : 0
    const genderMap = {}
    users.forEach(u => {
      if (u.gender) genderMap[u.gender] = (genderMap[u.gender] || 0) + 1
    })
    const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }))
    const levelMap = {}
    users.forEach(u => {
      if (u.fitnessLevel) levelMap[u.fitnessLevel] = (levelMap[u.fitnessLevel] || 0) + 1
    })
    const fitnessLevelDistribution = Object.entries(levelMap).map(([level, count]) => ({ level, count }))
    const goalMap = {}
    users.forEach(u => {
      if (u.goal) goalMap[u.goal] = (goalMap[u.goal] || 0) + 1
    })
    const goalDistribution = Object.entries(goalMap).map(([goal, count]) => ({ goal, count }))
    return { totalUsers, averageAge, genderDistribution, fitnessLevelDistribution, goalDistribution }
  },

  generatorStatus: () => ({ isRunning }),

  userLogs: async ({ page = 1, limit = 20, userId }) => {
    const p = Math.max(1, page)
    const l = Math.max(1, limit)
    const where = {}
    if (userId) where.userId = userId
    const { count, rows } = await UserLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: l,
      offset: (p - 1) * l
    })
    return { data: rows, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) }
  },

  health: () => 'FitNova API is running',

  // ── Mutations ─────────────────────────────────────────────────────────────

  createPlan: async ({ name, description, userId, exercises = [] }, context) => {
    requireUser(context)
    validatePlanData(name, description)
    const actorId = context.userId || userId
    const plan = await Plan.create({
      name: name.trim(),
      description: description.trim(),
      status: 'Inactive',
      created: new Date().toISOString().split('T')[0],
      userId
    })
    if (exercises && exercises.length > 0) {
      await Exercise.bulkCreate(exercises.map(e => ({ ...e, planId: plan.id })))
    }
    await logAction(actorId, `Created plan "${name.trim()}"`)
    return Plan.findByPk(plan.id, {
      include: [
        { model: Exercise, as: 'exercises' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    })
  },

  updatePlan: async ({ id, name, description, exercises, userId }, context) => {
    requireUser(context)
    const plan = await Plan.findByPk(id)
    if (!plan) throw new Error('Plan not found')
    validatePlanData(name, description)
    const actorId = context.userId || userId || plan.userId
    await plan.update({ name: name.trim(), description: description.trim() })
    if (exercises !== undefined) {
      await Exercise.destroy({ where: { planId: id } })
      if (exercises.length > 0) {
        await Exercise.bulkCreate(exercises.map(e => ({ ...e, planId: id })))
      }
    }
    await logAction(actorId, `Updated plan "${name.trim()}" (id: ${id})`)
    return Plan.findByPk(id, {
      include: [
        { model: Exercise, as: 'exercises' },
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    })
  },

  deletePlan: async ({ id }, context) => {
    requireUser(context)
    const plan = await Plan.findByPk(id)
    if (!plan) throw new Error('Plan not found')
    const planName = plan.name
    const actorId = context.userId
    await Exercise.destroy({ where: { planId: id } })
    await plan.destroy()
    await logAction(actorId, `Deleted plan "${planName}" (id: ${id})`)
    return { message: 'Plan deleted successfully' }
  },

  activatePlan: async ({ id }, context) => {
    requireUser(context)
    const plan = await Plan.findByPk(id)
    if (!plan) throw new Error('Plan not found')
    const actorId = context.userId
    await Plan.update({ status: 'Inactive' }, { where: { userId: plan.userId } })
    await plan.update({ status: 'Active' })
    await logAction(actorId, `Activated plan "${plan.name}" (id: ${id})`)
    return Plan.findByPk(id, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
  },

  deleteExercise: async ({ planId, exerciseId }, context) => {
    requireUser(context)
    const exercise = await Exercise.findOne({ where: { id: exerciseId, planId } })
    if (!exercise) throw new Error('Exercise not found')
    const plan = await Plan.findByPk(planId)
    const actorId = context.userId
    await exercise.destroy()
    await logAction(actorId, `Deleted exercise "${exercise.name}" from plan "${plan.name}"`)
    return Plan.findByPk(planId, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
  },

  register: async ({ firstName, lastName, email, password, confirmPassword, age, gender, height, weight, fitnessLevel, goal, securityQuestion, securityAnswer }, context) => {
    const errors = validateUserData({ firstName, lastName, email, password, confirmPassword, age, gender })
    if (!securityQuestion) errors.push('Security question is required')
    if (!securityAnswer || securityAnswer.trim() === '') errors.push('Security answer is required')
    const existing = await User.findOne({ where: { email } })
    if (existing) errors.push('Email already exists')
    if (errors.length > 0) throw new Error(errors.join(' | '))
    const hashedPassword = await bcrypt.hash(password, 10)
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10)
    const userRole = await Role.findOne({
      where: { name: 'user' },
      include: [{ model: Permission }]
    })
    const user = await User.create({
      firstName, lastName, email, gender,
      password: hashedPassword,
      age, height, weight, fitnessLevel, goal,
      securityQuestion,
      securityAnswer: hashedAnswer,
      roleId: userRole ? userRole.id : null
    })
    await logAction(user.id, `Registered new account with email ${email}`)
    const fullUser = await User.findByPk(user.id, {
      include: [{ model: Role, include: [{ model: Permission }] }]
    })
    const permissions = fullUser.Role?.Permissions?.map(p => p.name) || []
    const token = jwt.sign(
      { userId: user.id, role: 'user', permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )
    await issueRefreshToken(user.id, 'user', permissions, context.res)
    const { password: _, securityAnswer: __, ...userWithoutPassword } = fullUser.toJSON()
    return {
      user: { ...userWithoutPassword, role: userWithoutPassword.Role || null },
      message: 'Registration successful',
      token
    }
  },

  // ── Login now only verifies credentials and sends 2FA code ────────────────
  // The actual JWT is issued after all 3 steps via /api/auth/verify-security
  login: async ({ email, password }, context) => {
    if (!email || !password) throw new Error('Email and password are required')
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, include: [{ model: Permission }] }]
    })
    if (!user) {
      console.log(`Failed login attempt for email: ${email}`)
      throw new Error('No account found with this email')
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      await logAction(user.id, `Failed login attempt — incorrect password`)
      throw new Error('Incorrect password')
    }

    // Check if user has security question set up
    // If not (e.g. existing users before 3-way auth), do direct login
    if (!user.securityQuestion || !user.securityAnswer) {
      await logAction(user.id, `Logged in successfully (no 2FA)`)
      const permissions = user.Role?.Permissions?.map(p => p.name) || []
      const token = jwt.sign(
        { userId: user.id, role: user.Role?.name || 'user', permissions },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      )
      await issueRefreshToken(user.id, user.Role?.name || 'user', permissions, context.res)
      const { password: _, ...userWithoutPassword } = user.toJSON()
      return {
        user: { ...userWithoutPassword, role: userWithoutPassword.Role || null },
        message: 'Login successful',
        token,
        requiresTwoFactor: false
      }
    }

    // Password correct — trigger 2FA flow
    await logAction(user.id, `Password verified — 2FA code sent`)
    return {
      user: null,
      message: '2FA required',
      token: null,
      requiresTwoFactor: true,
      userId: user.id
    }
  },

  startGenerator: async ({ interval = 2000, userId }, context) => {
    requireUser(context)
    if (isRunning) throw new Error('Generator is already running')
    const actorId = context.userId || userId
    isRunning = true
    generatorInterval = setInterval(async () => {
      const exerciseCount = faker.number.int({ min: 2, max: 6 })
      const plan = await Plan.create({
        name: faker.helpers.arrayElement(fitnessAdjectives) + ' ' + faker.helpers.arrayElement(fitnessNouns) + ' Plan',
        description: faker.helpers.arrayElement(fitnessDescriptions),
        status: 'Inactive',
        created: new Date().toISOString().split('T')[0],
        userId
      })
      const exercises = Array.from({ length: exerciseCount }, (_, i) => ({
        name: faker.helpers.arrayElement(fitnessExerciseAdjectives) + ' ' + faker.helpers.arrayElement(fitnessExerciseNouns),
        muscle: faker.helpers.arrayElement(muscles),
        sets: faker.number.int({ min: 2, max: 6 }),
        reps: faker.number.int({ min: 6, max: 20 }),
        rest: faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 }),
        met: faker.number.float({ min: 3.0, max: 9.0, fractionDigits: 1 }),
        planId: plan.id
      }))
      await Exercise.bulkCreate(exercises)
      await logAction(actorId, `Generator created plan "${plan.name}" (id: ${plan.id})`)
      if (context && context.broadcast) {
        const allPlans = await Plan.findAll({ include: [{ model: Exercise, as: 'exercises' }] })
        context.broadcast({ type: 'NEW_PLANS', plans: allPlans })
      }
    }, interval)
    return { message: 'Generator started', interval }
  },

  stopGenerator: async (args, context) => {
    requireUser(context)
    if (!isRunning) throw new Error('Generator is not running')
    clearInterval(generatorInterval)
    generatorInterval = null
    isRunning = false
    await logAction(context.userId, `Stopped the plan generator`)
    return { message: 'Generator stopped' }
  }
}

module.exports = resolvers