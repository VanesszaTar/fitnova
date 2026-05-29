const express = require('express')
const router = express.Router()
const { Plan, Exercise } = require('../models')
const checkPermission = require('../middleware/checkPermission')
const requireAuth = require('../middleware/requireAuth')
const logAction = require('../utils/userLogger')

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
  { id: 25, name: 'Mountain Climbers', muscle: 'Full Body' },
]

function validatePlan(data) {
  const errors = {}
  if (!data.name || data.name.trim() === '')
    errors.name = 'Plan name is required'
  if (!data.description || data.description.trim() === '')
    errors.description = 'Description is required'
  if (data.exercises !== undefined) {
    if (!Array.isArray(data.exercises)) {
      errors.exercises = 'Exercises must be an array'
    } else {
      data.exercises.forEach((ex, i) => {
        if (!ex.name || ex.name.trim() === '')
          errors[`exercises[${i}].name`] = 'Exercise name is required'
        if (ex.sets === undefined || ex.sets <= 0)
          errors[`exercises[${i}].sets`] = 'Sets must be greater than 0'
        if (ex.reps === undefined || ex.reps <= 0)
          errors[`exercises[${i}].reps`] = 'Reps must be greater than 0'
        if (ex.rest === undefined || ex.rest < 0)
          errors[`exercises[${i}].rest`] = 'Rest time cannot be negative'
        if (ex.met === undefined || ex.met <= 0)
          errors[`exercises[${i}].met`] = 'met VALUE must be greater than 0'
      })
    }
  }
  return errors
}

// ── GET ALL PLANS (requires login) ────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 5)
    const offset = (page - 1) * limit
    const where = {}
    if (req.query.status) where.status = req.query.status
    const { count, rows } = await Plan.findAndCountAll({
      where,
      include: [{ model: Exercise, as: 'exercises' }],
      limit,
      offset
    })
    res.json({ data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PLAN STATS (requires login) ───────────────────────────────────────────
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const plans = await Plan.findAll({ include: [{ model: Exercise, as: 'exercises' }] })
    const totalPlans = plans.length
    const activePlan = plans.find(p => p.status === 'Active') || null
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
    res.json({
      totalPlans,
      activePlan: activePlan ? { id: activePlan.id, name: activePlan.name } : null,
      totalExercises, totalSets,
      highestComplexity: plansWithScore[0] || null,
      plansWithScore, muscleDistribution
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── AVAILABLE EXERCISES (public) ──────────────────────────────────────────
router.get('/exercises/available', (req, res) => {
  res.json(availableExercises)
})

// ── GET PLAN BY ID (requires login) ──────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await Plan.findByPk(parseInt(req.params.id), {
      include: [{ model: Exercise, as: 'exercises' }]
    })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    res.json(plan)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── CREATE PLAN ───────────────────────────────────────────────────────────
router.post('/', checkPermission('manage_plans'), async (req, res) => {
  try {
    const errors = validatePlan(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ errors })

    const plan = await Plan.create({
      userId: req.body.userId || req.currentUser.id,
      name: req.body.name,
      description: req.body.description,
      status: 'Inactive',
      created: new Date().toISOString().split('T')[0]
    })

    if (req.body.exercises && req.body.exercises.length > 0) {
      await Exercise.bulkCreate(
        req.body.exercises.map(ex => ({ ...ex, planId: plan.id }))
      )
    }

    await logAction(req.currentUser.id, `Created plan "${req.body.name}"`)

    const result = await Plan.findByPk(plan.id, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
    res.status(201).json(result)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── UPDATE PLAN ───────────────────────────────────────────────────────────
router.put('/:id', checkPermission('manage_plans'), async (req, res) => {
  try {
    const plan = await Plan.findByPk(parseInt(req.params.id))
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    const errors = validatePlan(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ errors })
    await plan.update({ name: req.body.name, description: req.body.description })
    if (req.body.exercises !== undefined) {
      await Exercise.destroy({ where: { planId: plan.id } })
      if (req.body.exercises.length > 0) {
        await Exercise.bulkCreate(
          req.body.exercises.map(ex => ({ ...ex, planId: plan.id }))
        )
      }
    }
    await logAction(req.currentUser.id, `Updated plan "${req.body.name}" (id: ${req.params.id})`)
    const result = await Plan.findByPk(plan.id, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── DELETE PLAN ───────────────────────────────────────────────────────────
router.delete('/:id', checkPermission('delete_any_plan'), async (req, res) => {
  try {
    const plan = await Plan.findByPk(parseInt(req.params.id))
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    const planName = plan.name
    await Exercise.destroy({ where: { planId: plan.id } })
    await plan.destroy()
    await logAction(req.currentUser.id, `Deleted plan "${planName}" (id: ${req.params.id})`)
    res.json({ message: 'Plan deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── ACTIVATE PLAN ─────────────────────────────────────────────────────────
router.patch('/:id/activate', checkPermission('manage_plans'), async (req, res) => {
  try {
    const plan = await Plan.findByPk(parseInt(req.params.id))
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    await Plan.update({ status: 'Inactive' }, { where: {} })
    await plan.update({ status: 'Active' })
    await logAction(req.currentUser.id, `Activated plan "${plan.name}" (id: ${req.params.id})`)
    const result = await Plan.findByPk(plan.id, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── DELETE EXERCISE FROM PLAN ─────────────────────────────────────────────
router.delete('/:id/exercises/:exerciseId', checkPermission('manage_plans'), async (req, res) => {
  try {
    const plan = await Plan.findByPk(parseInt(req.params.id))
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    const exercise = await Exercise.findOne({
      where: { id: parseInt(req.params.exerciseId), planId: plan.id }
    })
    if (!exercise) return res.status(404).json({ error: 'Exercise not found in this plan' })
    await exercise.destroy()
    await logAction(req.currentUser.id, `Deleted exercise "${exercise.name}" from plan "${plan.name}"`)
    const result = await Plan.findByPk(plan.id, {
      include: [{ model: Exercise, as: 'exercises' }]
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router