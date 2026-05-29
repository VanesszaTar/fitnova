const express = require('express')
const router = express.Router()
const { User, Plan, Exercise } = require('../models')

// GET /api/stats/heavy — SLOW version (no optimization)
router.get('/heavy', async (req, res) => {
  try {
    // Fetch everything separately — no joins, N+1 query pattern
    const users = await User.findAll()
    const plans = await Plan.findAll()
    const exercises = await Exercise.findAll()

    // Do all joining in JS — very inefficient
    const stats = users.map(user => {
      const userPlans = plans.filter(p => p.userId === user.id)

      const userExercises = userPlans.flatMap(plan =>
        exercises.filter(e => e.planId === plan.id)
      )

      const totalVolume = userExercises.reduce((sum, e) => sum + (e.sets * e.reps), 0)

      const avgMet = userExercises.length
        ? userExercises.reduce((sum, e) => sum + parseFloat(e.met), 0) / userExercises.length
        : 0

      const muscleGroups = [...new Set(userExercises.map(e => e.muscle))]

      // Extra expensive: sort exercises by volume for each user
      const sortedByVolume = [...userExercises].sort((a, b) => (b.sets * b.reps) - (a.sets * a.reps))

      // Extra expensive: compute per-muscle breakdown
      const muscleBreakdown = muscleGroups.map(muscle => ({
        muscle,
        count: userExercises.filter(e => e.muscle === muscle).length,
        avgSets: userExercises.filter(e => e.muscle === muscle)
          .reduce((s, e) => s + e.sets, 0) / (userExercises.filter(e => e.muscle === muscle).length || 1)
      }))

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        totalPlans: userPlans.length,
        totalExercises: userExercises.length,
        avgMet: Math.round(avgMet * 100) / 100,
        totalVolume,
        muscleGroups,
        muscleBreakdown,
        topExercise: sortedByVolume[0]?.name || null
      }
    })

    res.json({ userCount: stats.length, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/stats/fast — FAST version (with indices + caching)
const cache = {}

router.get('/fast', async (req, res) => {
  try {
    // ── Cache check ──────────────────────────────────────
    const cacheKey = 'heavy_stats'
    const CACHE_TTL = 60000 // 60 seconds

    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return res.json({ ...cache[cacheKey].data, source: 'cache' })
    }

    // ── Single optimised SQL query instead of 3 separate fetches ──
    const { sequelize } = require('../models')
    const { QueryTypes } = require('sequelize')

    const rows = await sequelize.query(`
      SELECT
        u.id AS "userId",
        u."firstName",
        u."lastName",
        COUNT(DISTINCT p.id) AS "totalPlans",
        COUNT(e.id) AS "totalExercises",
        ROUND(AVG(e.met)::numeric, 2) AS "avgMet",
        SUM(e.sets * e.reps) AS "totalVolume",
        STRING_AGG(DISTINCT e.muscle, ',') AS "muscles"
      FROM "Users" u
      LEFT JOIN "Plans" p ON p."userId" = u.id
      LEFT JOIN "Exercises" e ON e."planId" = p.id
      GROUP BY u.id, u."firstName", u."lastName"
      ORDER BY u.id
    `, { type: QueryTypes.SELECT })

    const stats = rows.map(row => ({
      userId: row.userId,
      name: `${row.firstName} ${row.lastName}`,
      totalPlans: parseInt(row.totalPlans),
      totalExercises: parseInt(row.totalExercises),
      avgMet: parseFloat(row.avgMet) || 0,
      totalVolume: parseInt(row.totalVolume) || 0,
      muscleGroups: row.muscles ? row.muscles.split(',') : []
    }))

    const result = { userCount: stats.length, stats }

    // ── Store in cache ───────────────────────────────────
    cache[cacheKey] = { data: result, timestamp: Date.now() }

    res.json({ ...result, source: 'db' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router