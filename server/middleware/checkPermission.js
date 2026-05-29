const jwt = require('jsonwebtoken')

module.exports = (permissionName) => {
  return async (req, res, next) => {

    // Skip permission checks in test environment
    if (process.env.NODE_ENV === 'test') {
      req.currentUser = { id: 1 }
      return next()
    }

    try {
      const authHeader = req.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized — no token provided' })
      }

      const token = authHeader.split(' ')[1]

      let decoded
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Session expired — please log in again' })
        }
        return res.status(401).json({ error: 'Invalid token' })
      }

      // Read permissions directly from the token — no database call needed
      const permissions = decoded.permissions || []
      const hasPermission = permissions.includes(permissionName)

      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden — insufficient permissions' })
      }

      req.currentUser = { id: decoded.userId, role: decoded.role, permissions }
      next()
    } catch (err) {
      res.status(500).json({ error: 'Server error' })
    }
  }
}