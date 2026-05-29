const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { RefreshToken, PasswordResetToken, TwoFactorCode, User, Role, Permission } = require('../models')

// ── Email client ───────────────────────────────────────────────────────────
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendMail({ to, subject, html }) {
  return sgMail.send({
    from: 'vanessatar05@gmail.com',
    to,
    subject,
    html
  })
}

// ── Refresh token helper ───────────────────────────────────────────────────
async function issueRefreshToken(userId, role, permissions, res) {
  const refreshToken = jwt.sign(
    { userId, role, permissions },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })
  if (res) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
  }
}

// ── REFRESH TOKEN ──────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const storedToken = await RefreshToken.findOne({ where: { token } })
    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token has been revoked' })
    }

    if (new Date() > storedToken.expiresAt) {
      await storedToken.destroy()
      return res.status(401).json({ error: 'Refresh token expired' })
    }

    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        permissions: decoded.permissions || []
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    res.json({ token: newAccessToken })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── LOGOUT ─────────────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      await RefreshToken.destroy({ where: { token } })
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    })
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const user = await User.findOne({ where: { email } })

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }

    await PasswordResetToken.destroy({ where: { userId: user.id } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRES_IN || 900000))

    await PasswordResetToken.create({ token, userId: user.id, expiresAt })

    const resetUrl = `${req.headers.origin}/reset-password?token=${token}`

    await sendMail({
      to: email,
      subject: 'Reset your FitNova password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e0607e;">Reset your password</h2>
          <p>You requested a password reset for your FitNova account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background: linear-gradient(135deg, #e0607e, #c2714f);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    })

    res.json({ message: 'If that email exists, a reset link has been sent' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── RESET PASSWORD ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' })
    }

    const resetToken = await PasswordResetToken.findOne({ where: { token } })

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'Reset token has already been used' })
    }

    if (new Date() > resetToken.expiresAt) {
      await resetToken.destroy()
      return res.status(400).json({ error: 'Reset token has expired' })
    }

    if (password.length < 10) {
      return res.status(400).json({ error: 'Password must be at least 10 characters' })
    }
    if ((password.match(/[A-Z]/g) || []).length < 2) {
      return res.status(400).json({ error: 'Password must contain at least 2 uppercase letters' })
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 digit' })
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least 1 special character' })
    }

    const hashed = await bcrypt.hash(password, 10)
    await User.update({ password: hashed }, { where: { id: resetToken.userId } })
    await resetToken.update({ used: true })

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── SEND 2FA CODE ──────────────────────────────────────────────────────────
router.post('/send-2fa', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const user = await User.findByPk(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    await TwoFactorCode.destroy({ where: { userId } })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await TwoFactorCode.create({ userId, code, expiresAt })

    await sendMail({
      to: user.email,
      subject: 'Your FitNova verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e0607e;">Your verification code</h2>
          <p>Use the code below to complete your login. It expires in <strong>5 minutes</strong>.</p>
          <div style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #e0607e;
            background: #1a1a1a;
            padding: 20px 32px;
            border-radius: 12px;
            display: inline-block;
            margin: 16px 0;
          ">${code}</div>
          <p style="color: #999; font-size: 13px;">If you didn't try to log in, ignore this email.</p>
        </div>
      `
    })

    res.json({ message: '2FA code sent', userId })
  } catch (err) {
    console.error('Send 2FA error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── VERIFY 2FA CODE ────────────────────────────────────────────────────────
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body
    if (!userId || !code) return res.status(400).json({ error: 'userId and code are required' })

    const twoFactorCode = await TwoFactorCode.findOne({ where: { userId, code } })

    if (!twoFactorCode) {
      return res.status(400).json({ error: 'Invalid code' })
    }

    if (twoFactorCode.used) {
      return res.status(400).json({ error: 'Code has already been used' })
    }

    if (new Date() > twoFactorCode.expiresAt) {
      await twoFactorCode.destroy()
      return res.status(400).json({ error: 'Code has expired' })
    }

    await twoFactorCode.update({ used: true })

    const tempToken = jwt.sign(
      { userId, step: 'security-question' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    const user = await User.findByPk(userId)

    res.json({
      message: '2FA verified',
      tempToken,
      securityQuestion: user.securityQuestion
    })
  } catch (err) {
    console.error('Verify 2FA error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── VERIFY SECURITY QUESTION ───────────────────────────────────────────────
router.post('/verify-security', async (req, res) => {
  try {
    const { tempToken, answer } = req.body
    if (!tempToken || !answer) {
      return res.status(400).json({ error: 'tempToken and answer are required' })
    }

    let decoded
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    if (decoded.step !== 'security-question') {
      return res.status(401).json({ error: 'Invalid session step' })
    }

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, include: [{ model: Permission }] }]
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const valid = await bcrypt.compare(answer.toLowerCase().trim(), user.securityAnswer)
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect answer' })
    }

    const permissions = user.Role?.Permissions?.map(p => p.name) || []
    const token = jwt.sign(
      { userId: user.id, role: user.Role?.name || 'user', permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    await issueRefreshToken(user.id, user.Role?.name || 'user', permissions, res)

    const { password: _, securityAnswer: __, ...rest } = user.toJSON()
    res.json({
      message: 'Login successful',
      user: { ...rest, role: rest.Role || null },
      token
    })
  } catch (err) {
    console.error('Verify security error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router