const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const { WebSocketServer } = require('ws')
const { createHandler } = require('graphql-http/lib/use/express')
const schema = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const sequelize = require('./database')
const mongoose = require('mongoose')
const Message = require('./models/message')
const logger = require('./middleware/logger')
const statsRouter = require('./routes/stats')
const { runDetection } = require('./utils/behaviourDetector')

const app = express()

app.use(cors({
  origin: function(origin, callback) {
    callback(null, origin || '*')
  },
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use(logger)
app.use('/api/stats', statsRouter)

const usersRouter = require('./routes/users')
const plansRouter = require('./routes/plans')
const chatRouter = require('./routes/chat')
const logsRouter = require('./routes/logs')
const authRouter = require('./routes/auth')

app.use('/api/users', usersRouter)
app.use('/api/plans', plansRouter)
app.use('/api/chat', chatRouter)
app.use('/api/logs', logsRouter)
app.use('/api/auth', authRouter)

let broadcast = () => {}

if (process.env.NODE_ENV !== 'test') {
  setImmediate(() => {
    const httpsServer = require('./index')
    const wss = new WebSocketServer({ server: httpsServer })

    wss.on('listening', () => console.log('WebSocket server listening (attached to HTTPS)'))
    wss.on('error', (err) => console.error('WebSocket server error:', err))
    wss.on('connection', (ws) => {
      console.log('WebSocket client connected')
      ws.on('message', async (data) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'CHAT_MESSAGE') {
            const message = await Message.create({
              senderId: parsed.senderId,
              receiverId: parsed.receiverId,
              senderName: parsed.senderName,
              text: parsed.text
            })
            broadcast({
              type: 'CHAT_MESSAGE',
              message: {
                _id: message._id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                senderName: message.senderName,
                text: message.text,
                timestamp: message.timestamp
              }
            })
          }
          if (parsed.type === 'CHAT_SEEN') {
            broadcast({
              type: 'CHAT_SEEN',
              senderId: parsed.senderId,
              receiverId: parsed.receiverId
            })
          }
        } catch (err) {
          console.error('WebSocket message error:', err)
        }
      })
      ws.on('close', () => console.log('WebSocket client disconnected'))
    })

    broadcast = (data) => {
      const message = JSON.stringify(data)
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(message)
      })
    }
  })
}

app.use('/api/graphql', createHandler({
  schema,
  rootValue: resolvers,
  context: (req) => {
    let userId = null
    let tokenExpired = false
    const authHeader = req.raw.headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET)
        userId = decoded.userId
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          tokenExpired = true
        }
      }
    }
    return { broadcast, userId, res: req.raw.res, tokenExpired }
  }
}))

app.get('/api/health', (req, res) => {
  res.json({ status: 'FitNova API is running' })
})

// ── Serve the built frontend (non-API routes only) ─────────────────────────
app.use(express.static(path.join(__dirname, '../dist')))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    // API route not matched above — fall through to 404 handler
    return next()
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'), err => {
    if (err) next()
  })
})

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.error('Database connection error:', err))

  mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/fitnova_chat')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err))

  setInterval(runDetection, 30000)
  console.log('Behaviour detector running every 30 seconds')
}

module.exports = app