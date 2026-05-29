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
const statuses = ['Active', 'Inactive']

async function seed() {
  console.log('🌱 Starting performance seeder...')
  console.log(`   Target: ${USERS_COUNT} users, ${USERS_COUNT * PLANS_PER_USER} plans, ${USERS_COUNT * PLANS_PER_USER * EXERCISES_PER_PLAN} exercises`)

  // ── Find user role ─────────────────────────────────────
  const userRole = await Role.findOne({ where: { name: 'user' } })
  if (!userRole) {
    console.error('❌ No "user" role found — run migrations and demo seeders first')
    process.exit(1)
  }

  // ── Create users in batches ────────────────────────────
  console.log(`\n👤 Creating ${USERS_COUNT} users...`)
  const hashedPassword = await bcrypt.hash('PAssword1!', 10)

  const BATCH_SIZE = 50
  const allUserIds = []

  for (let batch = 0; batch < USERS_COUNT / BATCH_SIZE; batch++) {
    const userRecords = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      const idx = batch * BATCH_SIZE + i
      userRecords.push({
        firstName: faker.person.firstName().replace(/\s/g, '').slice(0, 20),
        lastName: faker.person.lastName().replace(/\s/g, '').slice(0, 20),
        email: `seed_${idx}_${Date.now()}_${faker.internet.username().toLowerCase().replace(/[^a-z0-9]/g, '')}@faker.com`,
        password: hashedPassword,
        age: faker.number.int({ min: 14, max: 60 }),
        gender: faker.helpers.arrayElement(genders),
        height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
        weight: faker.number.float({ min: 50, max: 120, fractionDigits: 1 }),
        fitnessLevel: faker.helpers.arrayElement(fitnessLevels),
        goal: faker.helpers.arrayElement(goals),
        roleId: userRole.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const created = await User.bulkCreate(userRecords, { returning: true })
    created.forEach(u => allUserIds.push(u.id))
    console.log(`  ✓ Users ${batch * BATCH_SIZE + 1}–${(batch + 1) * BATCH_SIZE} created`)
  }

  console.log(`✅ ${allUserIds.length} users created`)

  // ── Create plans and exercises ─────────────────────────
  console.log(`\n📋 Creating plans and exercises...`)
  let totalPlans = 0
  let totalExercises = 0

  for (let i = 0; i < allUserIds.length; i++) {
    const userId = allUserIds[i]

    const planRecords = []
    for (let p = 0; p < PLANS_PER_USER; p++) {
      planRecords.push({
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(statuses),
        created: faker.date.recent({ days: 365 }).toISOString().split('T')[0],
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const createdPlans = await Plan.bulkCreate(planRecords, { returning: true })
    totalPlans += createdPlans.length

    const exerciseRecords = []
    for (const plan of createdPlans) {
      for (let e = 0; e < EXERCISES_PER_PLAN; e++) {
        exerciseRecords.push({
          name: faker.lorem.words(2),
          muscle: faker.helpers.arrayElement(muscles),
          sets: faker.number.int({ min: 2, max: 6 }),
          reps: faker.number.int({ min: 6, max: 20 }),
          rest: faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 }),
          met: faker.number.float({ min: 3.0, max: 9.0, fractionDigits: 1 }),
          planId: plan.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    await Exercise.bulkCreate(exerciseRecords)
    totalExercises += exerciseRecords.length

    if (i % 50 === 0) console.log(`  ✓ ${i + 1}/${allUserIds.length} users processed`)
  }

  console.log(`\n🎉 Seeding complete!`)
  console.log(`   Users:     ${allUserIds.length}`)
  console.log(`   Plans:     ${totalPlans}`)
  console.log(`   Exercises: ${totalExercises}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err.message)
  process.exit(1)
})