import { test, expect, Page } from '@playwright/test'
import { execSync } from 'child_process'

function getCode(email: string): string {
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

async function fullLogin(page: Page, email: string, password: string, answer: string) {
  await page.goto('http://localhost:5173/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('**/two-factor', { timeout: 15000 })
  const code = getCode(email)
  const digits = code.split('')
  for (let i = 0; i < digits.length; i++) {
    await page.locator('.tfa-digit').nth(i).fill(digits[i])
  }
  await page.getByRole('button', { name: 'Verify Code' }).click()
  await page.waitForURL('**/security-question', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  await page.locator('.fp-field input').fill(answer)
  await page.getByRole('button', { name: 'Complete Login' }).click()
}

const ADMIN = { email: 'vanessatar05@gmail.com', password: 'PAssword4!', answer: 'daisy' }
const USER  = { email: 'szalokantonia72@gmail.com', password: 'PAssword2!', answer: 'los angeles' }

async function loginAsAdmin(page: Page) {
  await fullLogin(page, ADMIN.email, ADMIN.password, ADMIN.answer)
  await page.waitForURL('**/admin', { timeout: 10000 })
}

async function loginAsUser(page: Page) {
  await fullLogin(page, USER.email, USER.password, USER.answer)
  await page.waitForURL('**/plans', { timeout: 10000 })
}

test.describe('Authentication & Authorization', () => {
  test.setTimeout(60000)

  test.beforeAll(() => {
    execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { User } = require('./models')
      User.destroy({ where: { email: 'tokentest2@example.com' } })
        .then(() => process.exit())
    "`)
  })

  test.beforeEach(() => {
    // Clear suspicious flags before each test
    execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { SuspiciousUser } = require('./models')
      SuspiciousUser.destroy({ where: {} })
        .then(() => process.exit())
    "`)
  })

  test.afterAll(() => {
    execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { User } = require('./models')
      User.destroy({ where: { email: 'tokentest2@example.com' } })
        .then(() => process.exit())
    "`)
  })

  test('token is stored in memory after login', async ({ page }) => {
    await loginAsUser(page)
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'))
    expect(tokenInStorage).toBeNull()
    await expect(page.locator('.master-topbar-title')).toHaveText('Workout Plans')
  })

  test('redirects to login when accessing /plans without being logged in', async ({ page }) => {
    await page.goto('http://localhost:5173/plans')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('redirects to login when accessing /stats without being logged in', async ({ page }) => {
    await page.goto('http://localhost:5173/stats')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('redirects to login when accessing /admin without being logged in', async ({ page }) => {
    await page.goto('http://localhost:5173/admin')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('normal user cannot access /admin route', async ({ page }) => {
    await loginAsUser(page)
    await page.goto('http://localhost:5173/admin')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('normal user can access /plans', async ({ page }) => {
    await loginAsUser(page)
    await expect(page.locator('.master-topbar-title')).toHaveText('Workout Plans')
    expect(page.url()).toContain('/plans')
  })

  test('normal user can access /stats', async ({ page }) => {
    await loginAsUser(page)
    await page.locator('.sidebar-item', { hasText: '📊 Reports' }).click()
    await page.waitForURL('**/stats', { timeout: 5000 })
    await expect(page).toHaveURL(/.*stats/)
  })

  test('admin user can access /admin route', async ({ page }) => {
    await loginAsAdmin(page)
    expect(page.url()).toContain('/admin')
  })

  test('user cannot access /plans after logging out', async ({ page }) => {
    await loginAsUser(page)
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.goto('http://localhost:5173/plans')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('token is cleared from memory after logout', async ({ page }) => {
    await loginAsUser(page)
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.goto('http://localhost:5173/plans')
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'))
    expect(tokenInStorage).toBeNull()
  })

  test('user is logged out after page refresh (token in memory only)', async ({ page }) => {
    await loginAsUser(page)
    await page.reload()
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('register flow issues a token and user can immediately log in', async ({ page }) => {
    await page.goto('http://localhost:5173/register')
    await page.locator('input[name="firstName"]').fill('Token')
    await page.locator('input[name="lastName"]').fill('Tester')
    await page.locator('input[name="age"]').fill('22')
    await page.locator('select[name="gender"]').selectOption('Male')
    await page.locator('input[name="email"]').fill('vanessatar05+token@gmail.com')
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('PAssword1!')
    await page.locator('select[name="securityQuestion"]').selectOption({ index: 1 })
    await page.locator('input[name="securityAnswer"]').fill('fluffy')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForURL('**/login', { timeout: 5000 })
    await fullLogin(page, 'vanessatar05+token@gmail.com', 'PAssword1!', 'fluffy')
    await page.waitForURL('**/plans', { timeout: 10000 })
    expect(page.url()).toContain('/plans')
    await expect(page.locator('.master-topbar-title')).toHaveText('Workout Plans')
  })

  test('inactivity timer resets on user activity', async ({ page }) => {
    await loginAsUser(page)
    await page.mouse.move(100, 100)
    await page.keyboard.press('Tab')
    await page.mouse.click(200, 200)
    await expect(page).toHaveURL(/.*plans/)
    await expect(page.locator('.master-topbar-title')).toHaveText('Workout Plans')
  })
})