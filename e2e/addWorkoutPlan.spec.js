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
  // Wait for TwoFactorPage to call sendTwoFactorCode and save to DB
  execSync('sleep 4')
  const code = getCode(email)
  const digits = code.split('')
  for (let i = 0; i < digits.length; i++) {
    await page.locator('.tfa-digit').nth(i).fill(digits[i])
  }
  await page.getByRole('button', { name: 'Verify Code' }).click()
  await page.waitForURL('**/security-question', { timeout: 10000 })
  await page.waitForLoadState('networkidle')

  await page.locator('.fp-field input').fill(securityAnswer)
  await page.getByRole('button', { name: 'Complete Login' }).click()
  await page.waitForTimeout(3000)
}

function cleanupPlans() {
  execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
    require('dotenv').config()
    const { Plan, User } = require('./models')
    User.findOne({ where: { email: 'vanessatar05@gmail.com' } })
      .then(u => Plan.destroy({ where: { name: 'My New Plan', userId: u.id } }))
      .then(() => process.exit())
  "`)
}

const USER = { email: 'vanessatar05@gmail.com', password: 'PAssword4!', answer: 'daisy' }

async function login(page) {
  await fullLogin(page, USER.email, USER.password, USER.answer)
  await page.waitForURL('**/admin', { timeout: 15000 })
  // Use sidebar navigation to preserve the in-memory token
  await page.locator('.sidebar-item', { hasText: '🏋️ Workout Plans' }).click()
  await page.waitForURL('**/plans', { timeout: 5000 })
}

test.describe('Create Workout Plan', () => {
  test.setTimeout(60000)

  test.beforeAll(() => {
    cleanupPlans()
  })

  test.beforeEach(async ({ page }) => {
    // Clear suspicious flags before each test
    execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
      require('dotenv').config()
      const { SuspiciousUser } = require('./models')
      SuspiciousUser.destroy({ where: {} })
        .then(() => process.exit())
    "`)
    await login(page)
  })

  test.afterAll(() => {
    cleanupPlans()
  })

  test('allows user to open create plan form', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await expect(page.getByText('New Workout Plan')).toBeVisible()
  })

  test('shows error when plan name is empty', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: 'Save Plan' }).click()
    await expect(page.locator('.modal-error').first()).toContainText('Plan name is required')
  })

  test('shows error when description is empty', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByPlaceholder('e.g. Push Day A').fill('Valid Plan Name')
    await page.getByRole('button', { name: 'Save Plan' }).click()
    await expect(page.locator('.modal-error')).toContainText('Description is required')
  })

  test('successfully creates plan with name and description', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByPlaceholder('e.g. Push Day A').fill('My New Plan')
    await page.getByPlaceholder('Describe this workout plan...').fill('Test description')
    await page.getByRole('button', { name: 'Save Plan' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('My New Plan').first()).toBeVisible()
  })

  test('shows add exercise button in modal', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await expect(page.getByRole('button', { name: '+ Add Exercise' })).toBeVisible()
  })

  test('displays exercise selection panel when add exercise is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await expect(page.locator('.exercise-panel')).toBeVisible()
    await expect(page.locator('.exercise-list')).toBeVisible()
  })

  test('allows user to select an exercise from the list', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').first().click()
    await expect(page.locator('.exercise-option.selected')).toBeVisible()
  })

  test('shows parameter fields after selecting an exercise', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').first().click()
    await expect(page.locator('.exercise-params')).toBeVisible()
    await expect(page.locator('.exercise-params-grid')).toBeVisible()
  })

  test('allows user to configure sets, reps, rest and MET', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').first().click()
    const inputs = page.locator('.exercise-params-grid input')
    await inputs.nth(0).fill('4')
    await inputs.nth(1).fill('12')
    await inputs.nth(2).fill('2')
    await inputs.nth(3).fill('6')
    await expect(inputs.nth(0)).toHaveValue('4')
    await expect(inputs.nth(1)).toHaveValue('12')
    await expect(inputs.nth(2)).toHaveValue('2')
    await expect(inputs.nth(3)).toHaveValue('6')
  })

  test('adds exercise to plan when Add to Plan button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').first().click()
    await page.getByRole('button', { name: '+ Add to Plan' }).click()
    await expect(page.locator('.added-exercises')).toBeVisible()
    await expect(page.locator('.added-exercise-row')).toHaveCount(1)
  })

  test('allows multiple exercises to be added to the same plan', async ({ page }) => {
    await page.getByRole('button', { name: '+ New Plan' }).click()

    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').nth(0).click()
    await page.getByRole('button', { name: '+ Add to Plan' }).click()

    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').nth(1).click()
    await page.getByRole('button', { name: '+ Add to Plan' }).click()

    await page.getByRole('button', { name: '+ Add Exercise' }).click()
    await page.locator('.exercise-option').nth(2).click()
    await page.getByRole('button', { name: '+ Add to Plan' }).click()

    await expect(page.locator('.added-exercise-row')).toHaveCount(3)
  })
})