const express = require('express')
const router = express.Router()
const Log = require('../models/log')
const { UserLog, User, Role } = require('../models')
const checkPermission = require('../middleware/checkPermission')

// ── MongoDB HTTP Logs  ──────────────────────────────────────────

// Admin only — get HTTP logs with filters and pagination
router.get('/', checkPermission('manage_users'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.level) filter.level = req.query.level
    if (req.query.method) filter.method = req.query.method
    if (req.query.userId) filter.userId = parseInt(req.query.userId)

    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      Log.countDocuments(filter)
    ])

    res.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin only — get HTTP log stats summary
router.get('/stats', checkPermission('manage_users'), async (req, res) => {
  try {
    const [total, info, warn, error] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ level: 'INFO' }),
      Log.countDocuments({ level: 'WARN' }),
      Log.countDocuments({ level: 'ERROR' })
    ])

    const avgResponse = await Log.aggregate([
      { $group: { _id: null, avg: { $avg: '$responseTime' } } }
    ])

    res.json({
      total,
      info,
      warn,
      error,
      avgResponseTime: Math.round(avgResponse[0]?.avg || 0)
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── SQL UserAction Logs ─────────────────────────────────────────────

// Admin only — get user action logs with filters and pagination
router.get('/user-logs', checkPermission('manage_users'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit

    const where = {}
    if (req.query.userId) where.userId = parseInt(req.query.userId)
    if (req.query.role) where.role = req.query.role

    const { count, rows } = await UserLog.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Role, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    res.json({
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin only — get user action log stats
router.get('/user-logs/stats', checkPermission('manage_users'), async (req, res) => {
  try {
    const total = await UserLog.count()
    const admins = await UserLog.count({ where: { role: 'ADMIN' } })
    const users = await UserLog.count({ where: { role: 'USER' } })

    const recentLogs = await UserLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName'] }
      ]
    })

    res.json({
      total,
      byRole: { ADMIN: admins, USER: users },
      recentActivity: recentLogs
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin only — get suspicious users observation list
router.get('/suspicious', checkPermission('manage_users'), async (req, res) => {
  try {
    const { SuspiciousUser } = require('../models')
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit

    const where = {}
    if (req.query.resolved === 'false') where.resolved = false
    if (req.query.resolved === 'true') where.resolved = true

    const { count, rows } = await SuspiciousUser.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['detectedAt', 'DESC']],
      limit,
      offset
    })

    res.json({
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin only — mark suspicious user as resolved
router.patch('/suspicious/:id/resolve', checkPermission('manage_users'), async (req, res) => {
  try {
    const { SuspiciousUser } = require('../models')
    const entry = await SuspiciousUser.findByPk(parseInt(req.params.id))
    if (!entry) return res.status(404).json({ error: 'Not found' })
    await entry.update({ resolved: true })
    res.json({ message: 'Marked as resolved' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router