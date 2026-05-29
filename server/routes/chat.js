const express = require('express')
const router = express.Router()
const Message = require('../models/message')
const { User } = require('../models')

// Get all users for chat (no permission required)
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.max(1, parseInt(req.query.limit) || 10)
    const offset = (page - 1) * limit

    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      attributes: { exclude: ['password'] }
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

// Get messages between two users
router.get('/', async (req, res) => {
  try {
    const { me, with: withUser } = req.query
    if (!me || !withUser) return res.json([])
    const messages = await Message.find({
      $or: [
        { senderId: parseInt(me), receiverId: parseInt(withUser) },
        { senderId: parseInt(withUser), receiverId: parseInt(me) }
      ]
    }).sort({ timestamp: 1 }).limit(100)
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router