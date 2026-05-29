const jwt = require('jsonwebtoken')
const Log = require('../models/log')

function logger(req, res, next) {
  // Skip logging entirely in test environment — MongoDB isn't available
  if (process.env.NODE_ENV === 'test') return next()

  const start = Date.now()

  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start
      const statusCode = res.statusCode

      let level = 'INFO'
      if (statusCode >= 500) level = 'ERROR'
      else if (statusCode >= 400) level = 'WARN'

      // Extract userId from JWT token
      let userId = null
      const authHeader = req.headers['authorization']
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1]
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          userId = decoded.userId
        } catch (err) {
          // Token invalid or missing — log without userId
        }
      }

      await Log.create({
        level,
        method: req.method,
        route: req.path,
        statusCode,
        responseTime,
        userId,
        ip: req.ip || req.connection.remoteAddress,
        message: `${req.method} ${req.path} — ${statusCode} — ${responseTime}ms`,
        error: null
      })
    } catch (err) {
      console.error('Logger error:', err.message)
    }
  })

  next()
}

module.exports = logger