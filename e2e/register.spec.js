import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

// ── Helpers ────────────────────────────────────────────────
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
  const digits = code.split('')
  for (let i = 0; i < digits.length; i++) {
    await page.locator('.tfa-digit').nth(i).fill(digits[i])
  }
  await page.getByRole('button', { name: 'Verify Code' }).click()
  await page.waitForURL('**/security-question', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  await page.locator('.fp-field input').fill(securityAnswer)
  await page.getByRole('button', { name: 'Complete Login' }).click()
}

function cleanupUsers() {
  execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
    require('dotenv').config()
    const { User } = require('./models')
    User.destroy({ where: { email: ['jane@example.com', 'jane14@example.com', 'vanessatar05+jane@gmail.com'] } })
      .then(() => process.exit())
  "`)
}

test.describe('Register Flow', () => {
  test.setTimeout(60000)

  test.beforeAll(() => {
    cleanupUsers()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/register')
  })

  test.afterAll(() => {
    cleanupUsers()
  })

  // 1.1 — system must allow users to create account with all required fields
  test('shows registration form with all required fields', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="age"]')).toBeVisible()
    await expect(page.locator('select[name="gender"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('select[name="securityQuestion"]')).toBeVisible()
    await expect(page.locator('input[name="securityAnswer"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  // 1.2 — first name must not contain spaces
  test('shows error when first name contains spaces', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('John Doe')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="firstName"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.3 — last name must not contain spaces
  test('shows error when last name contains spaces', async ({ page }) => {
    await page.locator('input[name="lastName"]').fill('Van Der Berg')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="lastName"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.4 — age must be numeric and >= 14
  test('shows error when age is below 14', async ({ page }) => {
    await page.locator('input[name="age"]').fill('12')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="age"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  test('passes when age is exactly 14', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="lastName"]').fill('Doe')
    await page.locator('input[name="age"]').fill('14')
    await page.locator('select[name="gender"]').selectOption('Female')
    await page.locator('input[name="email"]').fill('jane14@example.com')
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('PAssword1!')
    await page.locator('select[name="securityQuestion"]').selectOption({ index: 1 })
    await page.locator('input[name="securityAnswer"]').fill('fluffy')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText(/account created/i)).toBeVisible()
  })

  // 1.5 — email must contain @ and end with .com
  test('shows error when email has no @', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="lastName"]').fill('Doe')
    await page.locator('input[name="age"]').fill('25')
    await page.locator('select[name="gender"]').selectOption('Female')
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('PAssword1!')
    await page.locator('input[name="email"]').evaluate(el => el.type = 'text')
    await page.locator('input[name="email"]').fill('invalidemailcom')
    await page.locator('input[name="email"]').evaluate(el => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      nativeInputValueSetter.call(el, 'invalidemailcom')
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="email"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  test('shows error when email does not end with .com', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.ro')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="email"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.6 — email must be unique
  test('shows error when email is already registered', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="lastName"]').fill('Doe')
    await page.locator('input[name="age"]').fill('25')
    await page.locator('select[name="gender"]').selectOption('Female')
    await page.locator('input[name="email"]').fill('vanessatar05@gmail.com')
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('PAssword1!')
    await page.locator('select[name="securityQuestion"]').selectOption({ index: 1 })
    await page.locator('input[name="securityAnswer"]').fill('fluffy')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="email"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.7 — password rules
  test('shows error when password is shorter than 10 characters', async ({ page }) => {
    await page.locator('input[name="password"]').fill('Pass1!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="password"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  test('shows error when password has less than 2 uppercase letters', async ({ page }) => {
    await page.locator('input[name="password"]').fill('password1!aaa')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="password"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  test('shows error when password has no digit', async ({ page }) => {
    await page.locator('input[name="password"]').fill('PAssword!!!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="password"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  test('shows error when password has no special character', async ({ page }) => {
    await page.locator('input[name="password"]').fill('PAssword123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="password"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.8 — user must re-enter password to confirm it
  test('requires user to confirm password', async ({ page }) => {
    await page.locator('input[name="password"]').fill('PAssword1!')
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toHaveValue('')
  })

  // 1.9 — passwords must match
  test('shows error when passwords do not match', async ({ page }) => {
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('Different1!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(
      page.locator('input[name="confirmPassword"]').locator('..').locator('.reg-error')
    ).toBeVisible()
  })

  // 1.10 — any invalid field prevents registration
  test('prevents registration when fields are invalid', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('John Doe')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page).toHaveURL('http://localhost:5173/register')
    await expect(page.locator('.reg-error').first()).toBeVisible()
  })

  // 1.11 — valid data creates account and stores user
  test('successfully creates account and redirects to login', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Jane')
    await page.locator('input[name="lastName"]').fill('Doe')
    await page.locator('input[name="age"]').fill('25')
    await page.locator('select[name="gender"]').selectOption('Female')
    await page.locator('input[name="email"]').fill('vanessatar05+jane@gmail.com')
    await page.locator('input[name="password"]').fill('PAssword1!')
    await page.locator('input[name="confirmPassword"]').fill('PAssword1!')
    await page.locator('select[name="securityQuestion"]').selectOption({ index: 1 })
    await page.locator('input[name="securityAnswer"]').fill('fluffy')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText(/account created/i)).toBeVisible()
    await page.waitForURL('**/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
    await fullLogin(page, 'vanessatar05+jane@gmail.com', 'PAssword1!', 'fluffy')
    await page.waitForURL('**/plans', { timeout: 10000 })
    expect(page.url()).toContain('/plans')
  })
})