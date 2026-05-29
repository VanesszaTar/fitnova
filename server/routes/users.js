const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()
const { User, Role, Permission, RefreshToken } = require('../models')
const checkPermission = require('../middleware/checkPermission')
const requireAuth = require('../middleware/requireAuth')
const logAction = require('../utils/userLogger')

function validateUser(data, checkEmail = true, existingEmail = null) {
  const errors = {}

  if (!data.firstName || data.firstName.trim() === '') {
    errors.firstName = 'First name is required'
  } else if (/\s/.test(data.firstName)) {
    errors.firstName = 'First name must not contain spaces'
  }

  if (!data.lastName || data.lastName.trim() === '') {
    errors.lastName = 'Last name is required'
  } else if (/\s/.test(data.lastName)) {
    errors.lastName = 'Last name must not contain spaces'
  }

  if (!data.age || data.age === '') {
    errors.age = 'Age is required'
  } else if (isNaN(data.age)) {
    errors.age = 'Age must be a number'
  } else if (Number(data.age) < 14) {
    errors.age = 'User must be 14 or older'
  }

  if (!data.gender || data.gender === '') {
    errors.gender = 'Please select a gender'
  }

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!data.email.includes('@') || !data.email.endsWith('.com')) {
    errors.email = 'Email must contain @ and end with .com'
  }

  if (!data.password || data.password === '') {
    errors.password = 'Password is required'
  } else {
    if (data.password.length < 10) {
      errors.password = 'Password must be at least 10 characters'
    } else if ((data.password.match(/[A-Z]/g) || []).length < 2) {
      errors.password = 'Password must contain at least 2 uppercase letters'
    } else if (!/\d/.test(data.password)) {
      errors.password = 'Password must contain at least 1 digit'
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
      errors.password = 'Password must contain at least 1 special character'
    }
  }

  if (data.confirmPassword !== undefined) {
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
  }

  return errors
}

// ── GET ALL USERS (Admin only) ─────────────────────────────────────────────
router.get('/', checkPermission('view_all_users'), async (req, res) => {
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

// ── USER STATS (requires login) ────────────────────────────────────────────
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const users = await User.findAll()
    const genderCount = users.reduce((acc, u) => {
      acc[u.gender] = (acc[u.gender] || 0) + 1
      return acc
    }, {})
    const avgAge = users.length
      ? Math.round(users.reduce((sum, u) => sum + u.age, 0) / users.length)
      : 0

    res.json({
      totalUsers: users.length,
      averageAge: avgAge,
      genderDistribution: genderCount
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET USER BY ID (requires login) ───────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(parseInt(req.params.id), {
      attributes: { exclude: ['password'] }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── REGISTER (public) ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const errors = validateUser(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ errors })

    const existing = await User.findOne({ where: { email: req.body.email } })
    if (existing) return res.status(400).json({ errors: { email: 'This email is already registered' } })

    const hashed = bcrypt.hashSync(req.body.password, 10)
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: Number(req.body.age),
      gender: req.body.gender,
      email: req.body.email,
      password: hashed
    })

    await logAction(user.id, `Registered new account with email ${req.body.email}`)

    const userRole = await Role.findOne({
      where: { name: 'user' },
      include: [{ model: Permission }]
    })
    const permissions = userRole?.Permissions?.map(p => p.name) || []

    const token = jwt.sign(
      { userId: user.id, role: 'user', permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    // Issue refresh token on register too
    const refreshToken = jwt.sign(
      { userId: user.id, role: 'user', permissions },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    )
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    const { password, ...rest } = user.toJSON()
    res.status(201).json({ ...rest, token })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── LOGIN (public) ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email or password are required' })

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, include: [{ model: Permission }] }]
    })
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    await logAction(user.id, `Logged in successfully`)

    const permissions = user.Role?.Permissions?.map(p => p.name) || []

    // Sign access token — short lived (15 min)
    const token = jwt.sign(
      { userId: user.id, role: user.Role?.name || 'user', permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    // Sign refresh token — long lived (7 days)
    const refreshToken = jwt.sign(
      { userId: user.id, role: user.Role?.name || 'user', permissions },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    )

    // Store refresh token in database so we can invalidate it on logout
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    // Send refresh token as httpOnly cookie — JS cannot read this
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    const { password: _, ...rest } = user.toJSON()
    res.json({ message: 'Login successful', user: rest, token })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── UPDATE USER (requires login) ───────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(parseInt(req.params.id))
    if (!user) return res.status(404).json({ error: 'User not found' })

    const errors = validateUser({
      ...req.body,
      confirmPassword: undefined,
      password: req.body.password || 'Placeholder1!'
    }, false)
    delete errors.password
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ errors })

    await user.update({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: Number(req.body.age),
      gender: req.body.gender,
      email: req.body.email
    })

    await logAction(parseInt(req.params.id), `Updated profile information`)

    const { password, ...rest } = user.toJSON()
    res.json(rest)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── DELETE USER (Admin only) ───────────────────────────────────────────────
router.delete('/:id', checkPermission('manage_users'), async (req, res) => {
  try {
    const user = await User.findByPk(parseInt(req.params.id))
    if (!user) return res.status(404).json({ error: 'User not found' })

    const deletedName = `${user.firstName} ${user.lastName}`
    await user.destroy()

    await logAction(req.currentUser.id, `Deleted user ${deletedName} (id: ${req.params.id})`)

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router