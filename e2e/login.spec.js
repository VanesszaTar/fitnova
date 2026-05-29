import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

function getCode(email) {
  for (let i = 0; i < 15; i++) {
    const result = execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { Sequelize } = require('sequelize')
      const config = require('./config/config.json').development
      const sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host, dialect: config.dialect, logging: false
      })
      const { DataTypes } = require('sequelize')
      const User = sequelize.define('User', { email: DataTypes.STRING }, { tableName: 'Users' })
      const TwoFactorCode = sequelize.define('TwoFactorCode', { userId: DataTypes.INTEGER, code: DataTypes.STRING, used: DataTypes.BOOLEAN }, { tableName: 'TwoFactorCodes' })
      User.findOne({ where: { email: '${email}' } })
        .then(u => TwoFactorCode.findOne({ where: { userId: u.id }, order: [['createdAt', 'DESC']] }))
        .then(c => { process.stdout.write(c ? c.code : ''); process.exit() })
    "`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().slice(0, 6)

    if (result.length === 6) return result
    execSync('sleep 1')
  }
  return ''
}

async function fullLogin(page, email, password, securityAnswer) {
  await page.goto('http://localhost:5173/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('**/two-factor', { timeout: 15000 })
  const code = getCode(email)
  console.log('GOT CODE:', code)
  const digits = code.split('')
  for (let i = 0; i < digits.length; i++) {
    await page.locator('.tfa-digit').nth(i).fill(digits[i])
  }
  await page.getByRole('button', { name: 'Verify Code' }).click()
  await page.waitForURL('**/security-question', { timeout: 10000 })
  await page.locator('input[name="securityAnswer"], .fp-field input[type="text"]').first().fill(securityAnswer)
  await page.getByRole('button', { name: 'Complete Login' }).click()
}

const VANESSA = { email: 'vanessatar05@gmail.com', password: 'PAssword4!', answer: 'daisy' }

test.describe('Login Flow', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    // Clear suspicious flag for Vanessa before each test
    execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { SuspiciousUser } = require('./models')
      SuspiciousUser.destroy({ where: { userId: 21 } })
        .then(() => process.exit())
    "`)
    await page.goto('http://localhost:5173/login')
  })

  // 2.1 — system must allow users to log in with email and password
  test('shows login form with email and password fields', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
  })

  // 2.2 — system must verify if the provided email exists
  test('shows error when email does not exist in the system', async ({ page }) => {
    await page.locator('input[name="email"]').fill('notregistered@example.com')
    await page.locator('input[name="password"]').fill('SomePass1!')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.locator('.login-field-error').first()).toBeVisible()
  })

  // 2.3 — system must verify password matches
  test('shows error when password does not match', async ({ page }) => {
    await page.locator('input[name="email"]').fill(VANESSA.email)
    await page.locator('input[name="password"]').fill('WrongPassword1!')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.locator('.login-field-error').first()).toBeVisible()
  })

  // 2.4 — system must deny access and display error message
  test('denies access and shows error with invalid credentials', async ({ page }) => {
    await page.locator('input[name="email"]').fill('wrong@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL('http://localhost:5173/login')
  })

  // 2.5 — system must allow user to try again after failure
  test('allows user to try again after failed login', async ({ page }) => {
    await page.locator('input[name="email"]').fill('wrong@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.locator('.login-field-error').first()).toBeVisible()
    await expect(page.locator('input[name="email"]')).toHaveValue('')
    await expect(page.locator('input[name="password"]')).toHaveValue('')
    await fullLogin(page, VANESSA.email, VANESSA.password, VANESSA.answer)
    await page.waitForURL('**/admin', { timeout: 10000 })
    expect(page.url()).toContain('/admin')
  })

  // 2.6 — system must authenticate and grant access with valid credentials
  test('grants access and redirects to plans with valid credentials', async ({ page }) => {
    await fullLogin(page, VANESSA.email, VANESSA.password, VANESSA.answer)
    await page.waitForURL('**/admin', { timeout: 10000 })
    expect(page.url()).toContain('/admin')
  })
})