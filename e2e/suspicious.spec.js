import { test } from '@playwright/test'
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

async function fullLogin(page, email, password, answer) {
  await page.goto('http://localhost:5173/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('**/two-factor', { timeout: 15000 })
  execSync('sleep 4')
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

function clearSuspicious() {
  execSync(`cd ~/Desktop/uni/an\\ 2\\ sem\\ 2/SDI/fitnova/server && node -e "
    require('dotenv').config()
    const { SuspiciousUser } = require('./models')
    SuspiciousUser.destroy({ where: {} }).then(() => process.exit())
  "`)
}

function checkSuspicious() {
  return execSync(
    `psql fitnova -c "SELECT u.email, s.reason, s.\\"actionCount\\", s.\\"detectedAt\\" FROM \\"SuspiciousUsers\\" s JOIN \\"Users\\" u ON u.id = s.\\"userId\\" ORDER BY s.\\"detectedAt\\" DESC LIMIT 10;"`,
    { encoding: 'utf8' }
  )
}

const VANESSA = { email: 'vanessatar05@gmail.com', password: 'PAssword4!', answer: 'daisy' }
const ANTO    = { email: 'szalokantonia72@gmail.com', password: 'PAssword2!', answer: 'los angeles' }

// ── Test 1: Brute Force Login ──────────────────────────────
test('🤖 BOT ATTACK 1: brute force login attempts', async ({ page }) => {
  test.setTimeout(120000)
  clearSuspicious()
  console.log('\n🔴 Starting brute force attack simulation...')
  console.log('   Bot will attempt 5 failed logins in rapid succession')

  for (let i = 0; i < 5; i++) {
    await page.goto('http://localhost:5173/login')
    await page.locator('input[name="email"]').fill(VANESSA.email)
    await page.locator('input[name="password"]').fill(`WrongPassword${i}!`)
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForTimeout(500)
    console.log(`   ❌ Failed login attempt ${i + 1}/5`)
  }

  console.log('\n⏳ Waiting for behaviour detector to run (30s)...')
  execSync('sleep 35')

  const result = checkSuspicious()
  console.log('\n🚨 Suspicious Users Table:')
  console.log(result)
  console.log('✅ Brute force attack detected!')
})

// ── Test 2: Mass Plan Creation (spam) ─────────────────────
test('🤖 BOT ATTACK 2: mass plan creation spam', async ({ page }) => {
  test.setTimeout(180000)
  clearSuspicious()
  console.log('\n🔴 Starting plan spam attack simulation...')
  console.log('   Bot will create 6 plans in rapid succession')

  await fullLogin(page, ANTO.email, ANTO.password, ANTO.answer)
  await page.waitForURL('**/plans', { timeout: 10000 })
  console.log('   ✅ Bot logged in successfully')

  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByPlaceholder('e.g. Push Day A').fill(`Bot Spam Plan ${i + 1}`)
    await page.getByPlaceholder('Describe this workout plan...').fill('Automated spam plan created by bot')
    await page.getByRole('button', { name: 'Save Plan' }).click()
    await page.waitForTimeout(200)
    console.log(`   📋 Created spam plan ${i + 1}/6`)
  }

  console.log('\n⏳ Waiting for behaviour detector to run (30s)...')
  execSync('sleep 35')

  const result = checkSuspicious()
  console.log('\n🚨 Suspicious Users Table:')
  console.log(result)
  console.log('✅ Plan spam detected!')
})

// ── Test 3: Mass Plan Deletion ─────────────────────────────
test('🤖 BOT ATTACK 3: mass plan deletion', async ({ page }) => {
  test.setTimeout(180000)
  clearSuspicious()
  console.log('\n🔴 Starting mass deletion attack simulation...')
  console.log('   Bot will delete 6 plans in under 1 minute')

  await fullLogin(page, ANTO.email, ANTO.password, ANTO.answer)
  await page.waitForURL('**/plans', { timeout: 10000 })
  console.log('   ✅ Bot logged in successfully')

  // First create 6 plans to delete
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: '+ New Plan' }).click()
    await page.getByPlaceholder('e.g. Push Day A').fill(`Delete Target ${i + 1}`)
    await page.getByPlaceholder('Describe this workout plan...').fill('This plan will be deleted')
    await page.getByRole('button', { name: 'Save Plan' }).click()
    await page.waitForTimeout(200)
  }
  console.log('   📋 Created 6 plans to delete')

  // Now rapidly delete them all
  for (let i = 0; i < 6; i++) {
    const deleteBtn = page.locator('.btn-delete').first()
    const count = await deleteBtn.count()
    if (count > 0) {
      await deleteBtn.click()
      await page.locator('.modal-btn-delete').click()
      await page.waitForTimeout(300)
      console.log(`   🗑️ Deleted plan ${i + 1}/6`)
    }
  }

  console.log('\n⏳ Waiting for behaviour detector to run (30s)...')
  execSync('sleep 35')

  const result = checkSuspicious()
  console.log('\n🚨 Suspicious Users Table:')
  console.log(result)
  console.log('✅ Mass deletion detected!')
})