const { UserLog, SuspiciousUser, User } = require('../models')
const Log = require('../models/log')
const { Op } = require('sequelize')

const RULES = [
  {
    id: 'brute_force',
    reason: 'Multiple failed login attempts detected — possible brute force attack',
    check: async (userId) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      const lastSuccess = await UserLog.findOne({
        where: {
          userId,
          action: { [Op.iLike]: '%logged in successfully%' },
          createdAt: { [Op.gte]: fiveMinutesAgo }
        },
        order: [['createdAt', 'DESC']]
      })

      const since = lastSuccess ? lastSuccess.createdAt : fiveMinutesAgo

      const logs = await UserLog.findAll({
        where: {
          userId,
          action: { [Op.iLike]: '%failed login attempt%' },
          createdAt: { [Op.gte]: since }
        }
      })
      return { triggered: logs.length >= 3, count: logs.length, logs }
    }
  },
  {
    id: 'mass_deletion',
    reason: 'Mass plan deletion detected — unusual destructive behaviour',
    check: async (userId) => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      const logs = await UserLog.findAll({
        where: {
          userId,
          action: { [Op.iLike]: '%deleted plan%' },
          createdAt: { [Op.gte]: oneMinuteAgo }
        }
      })
      return { triggered: logs.length >= 5, count: logs.length, logs }
    }
  },
  {
    id: 'plan_spam',
    reason: 'Excessive manual plan creation detected — possible spam or bot behaviour',
    check: async (userId) => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      const logs = await UserLog.findAll({
        where: {
          userId,
          action: {
            [Op.and]: [
              { [Op.iLike]: '%created plan%' },
              { [Op.notILike]: '%generator%' }
            ]
          },
          createdAt: { [Op.gte]: oneMinuteAgo }
        }
      })
      return { triggered: logs.length >= 5, count: logs.length, logs }
    }
  },
  {
    id: 'high_request_rate',
    reason: 'Abnormally high request rate detected — possible automated bot',
    check: async (userId) => {
      try {
        const mongoose = require('mongoose')
        if (mongoose.connection.readyState !== 1) return { triggered: false, count: 0, logs: [] }
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000)
        const count = await Log.countDocuments({
          userId,
          timestamp: { $gte: tenSecondsAgo }
        })
        return { triggered: count >= 50, count, logs: [] }
      } catch {
        return { triggered: false, count: 0, logs: [] }
      }
    }
  }
]

// ── AI Analysis using Ollama HTTP API (llama3.2:1b) ───────
async function analyzeWithAI(user, ruleId, reason, count, logs) {
  try {
    const logSummary = logs.length > 0
      ? logs.slice(0, 5).map(l => l.action).join(' | ')
      : 'No detailed logs available'

    const prompt = `You are a cybersecurity expert reviewing server logs. A suspicious behaviour rule was triggered on a web application. Provide a 2-sentence threat assessment and recommended action. Do not ask questions, just analyze. Rule: ${ruleId}. Description: ${reason}. Number of suspicious actions: ${count}. Log entries: ${logSummary}`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt,
        stream: false
      })
    })

    if (!response.ok) return 'AI analysis unavailable — Ollama returned an error'

    const data = await response.json()
    return data.response?.trim() || 'AI analysis unavailable'
  } catch (err) {
    return 'AI analysis unavailable — Ollama may not be running'
  }
}

// ── Main detection loop ────────────────────────────────────
async function runDetection() {
  try {
    const users = await User.findAll({ attributes: ['id'] })

    for (const user of users) {
      for (const rule of RULES) {
        const { triggered, count, logs } = await rule.check(user.id)

        if (triggered) {
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
          const existing = await SuspiciousUser.findOne({
            where: {
              userId: user.id,
              reason: rule.reason,
              detectedAt: { [Op.gte]: tenMinutesAgo },
              resolved: false
            }
          })

          if (!existing) {
            await SuspiciousUser.create({
              userId: user.id,
              reason: rule.reason,
              actionCount: count,
              detectedAt: new Date(),
              resolved: false
            })

            console.log(`\n🚨 Suspicious behaviour detected for user ${user.id}: ${rule.id}`)
            console.log(`   Reason: ${rule.reason}`)
            console.log(`   Action count: ${count}`)
            console.log(`\n🤖 Analyzing with Llama 3 AI...`)

            const aiAnalysis = await analyzeWithAI(user, rule.id, rule.reason, count, logs)

            console.log(`\n🧠 AI Threat Assessment:`)
            console.log(`   ${aiAnalysis}`)
            console.log(`${'─'.repeat(60)}`)
          }
        }
      }
    }
  } catch (err) {
    console.error('Behaviour detector error:', err.message)
  }
}

module.exports = { runDetection }