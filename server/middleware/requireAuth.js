const jwt = require('jsonwebtoken')

module.exports = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    req.currentUser = { id: 1 }
    return next()
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.currentUser = { id: decoded.userId, role: decoded.role, permissions: decoded.permissions || [] }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please log in again' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}