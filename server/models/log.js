const mongoose = require('mongoose')

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR'],
    required: true
  },
  method: { type: String },
  route: { type: String },
  statusCode: { type: Number },
  responseTime: { type: Number },
  userId: { type: Number, default: null },
  ip: { type: String },
  message: { type: String },
  error: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
})

const Log = mongoose.model('Log', logSchema)

module.exports = Log