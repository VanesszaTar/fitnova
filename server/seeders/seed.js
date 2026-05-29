require('dotenv').config()
const { faker } = require('@faker-js/faker')
const bcrypt = require('bcryptjs')
const { User, Plan, Exercise, Role } = require('../models')

const USERS_COUNT = 500
const PLANS_PER_USER = 5
const EXERCISES_PER_PLAN = 5

const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Full Body']
const fitnessLevels = ['Beginner', 'Intermediate', 'Advanced']
const goals = ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness']
const genders = ['Male', 'Female', 'Other']

async function seed() {
  console.log('🌱 Starting seeder...')

  // ── Step 1: Find roles ─────────────────────────────────
  const userRole = await Role.findOne({ where: { name: 'user' } })
  if (!userRole) {
    console.error('❌ No user role found — make sure roles exist in DB')
    process.exit(1)
  }
  console.log('✅ Found user role:', userRole.id)

  // ── Step 2: Create users ───────────────────────────────
  console.log(`👤 Creating ${USERS_COUNT} users...`)
  const hashedPassword = await bcrypt.hash('PAssword1!', 10)

  const userRecords = []
  for (let i = 0; i < USERS_COUNT; i++) {
    const firstName = faker.person.firstName().replace(/\s/g, '')
    const lastName = faker.person.lastName().replace(/\s/g, '')
    const email = `seed_${i}_${faker.internet.email().toLowerCase()}`

    userRecords.push({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      age: faker.number.int({ min: 14, max: 60 }),
      gender: faker.helpers.arrayElement(genders),
      height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
      weight: faker.number.float({ min: 50, max: 120, fractionDigits: 1 }),
      fitnessLevel: faker.helpers.arrayElement(fitnessLevels),
      goal: faker.helpers.arrayElement(goals),
      roleId: userRole.id
    })

    if (i % 100 === 0) console.log(`  ... ${i}/${USERS_COUNT} users prepared`)
  }

  const createdUsers = await User.bulkCreate(userRecords, { returning: true })
  console.log(`✅ Created ${createdUsers.length} users`)

  // ── Step 3: Create plans and exercises ─────────────────
  console.log(`📋 Creating plans and exercises...`)
  let planCount = 0
  let exerciseCount = 0

  for (const user of createdUsers) {
    const plans = []
    for (let p = 0; p < PLANS_PER_USER; p++) {
      plans.push({
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['Active', 'Inactive']),
        created: faker.date.recent({ days: 365 }).toISOString().split('T')[0],
        userId: user.id
      })
    }

    const createdPlans = await Plan.bulkCreate(plans, { returning: true })
    planCount += createdPlans.length

    const exercises = []
    for (const plan of createdPlans) {
      for (let e = 0; e < EXERCISES_PER_PLAN; e++) {
        exercises.push({
          name: faker.lorem.words(2),
          muscle: faker.helpers.arrayElement(muscles),
          sets: faker.number.int({ min: 2, max: 6 }),
          reps: faker.number.int({ min: 6, max: 20 }),
          rest: faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 }),
          met: faker.number.float({ min: 3.0, max: 9.0, fractionDigits: 1 }),
          planId: plan.id
        })
      }
    }

    await Exercise.bulkCreate(exercises)
    exerciseCount += exercises.length
  }

  console.log(`✅ Created ${planCount} plans`)
  console.log(`✅ Created ${exerciseCount} exercises`)
  console.log(`\n🎉 Seeding complete!`)
  console.log(`   Users:     ${createdUsers.length}`)
  console.log(`   Plans:     ${planCount}`)
  console.log(`   Exercises: ${exerciseCount}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err)
  process.exit(1)
})