const express = require('express')
const router = express.Router()
const { faker } = require('@faker-js/faker')

let generatorInterval = null 
let isRunning = false

const muscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Full Body']

const fitnessAdjectives = [
  'Power', 'Elite', 'Ultimate', 'Intense', 'Dynamic', 'Advanced',
  'Explosive', 'Endurance', 'Strength', 'Athletic', 'Heavy', 'Max',
  'Hypertrophy', 'Functional', 'Compound', 'Metabolic', 'Cardio', 'Speed'
]

const fitnessNouns = [
  'Push', 'Pull', 'Squat', 'Press', 'Deadlift', 'Burn', 'Blast',
  'Circuit', 'Split', 'Session', 'Grind', 'Drive', 'Build', 'Shred',
  'Pump', 'Flow', 'Force', 'Storm', 'Rush', 'Surge'
]

const fitnessExerciseAdjectives = [
  'Heavy', 'Slow', 'Fast', 'Wide', 'Close', 'Reverse', 'Seated',
  'Standing', 'Incline', 'Decline', 'Weighted', 'Assisted', 'Single',
  'Double', 'Explosive', 'Paused', 'Tempo', 'Strict', 'Loaded'
]

const fitnessExerciseNouns = [
  'Press', 'Row', 'Curl', 'Raise', 'Fly', 'Pulldown', 'Extension',
  'Squat', 'Lunge', 'Deadlift', 'Pushdown', 'Crunch', 'Plank',
  'Dip', 'Shrug', 'Swing', 'Carry', 'Hold', 'Pull', 'Thrust'
]

const fitnessDescriptions = [
  'Focus on progressive overload with compound movements.',
  'High volume session targeting muscle hypertrophy.',
  'Strength-focused training with heavy compound lifts.',
  'Metabolic conditioning with supersets and minimal rest.',
  'Full range of motion exercises for maximum muscle activation.',
  'Explosive movements combined with controlled negatives.',
  'Endurance-based training to build muscular stamina.',
  'Isolation exercises to target specific muscle groups.',
  'Push your limits with this high intensity workout.',
  'Balanced training session for overall fitness development.'
]

function generateExercise(id) {
    return {
        id,
        name: faker.helpers.arrayElement(fitnessExerciseAdjectives) + ' ' + faker.helpers.arrayElement(fitnessExerciseNouns),
        muscle: faker.helpers.arrayElement(muscles),
        sets: faker.number.int({ min: 2, max: 6 }),
        reps: faker.number.int({ min: 6, max: 20 }),
        rest: faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 }),
        met: faker.number.float({ min: 3.0, max: 9.0, fractionDigits: 1 })
    }
}

function generatePlan(existingPlans) {
    const exerciseCount = faker.number.int({ min: 2, max: 6 })
    const exercises = Array.from({ length: exerciseCount }, (_, i) =>
        generateExercise(i + 1)
    )
    return {
        id: Date.now(),
        userId: 1,
        name: faker.helpers.arrayElement(fitnessAdjectives) + ' ' + faker.helpers.arrayElement(fitnessNouns) + ' Plan',
        description: faker.helpers.arrayElement(fitnessDescriptions),
        status: 'Inactive',
        created: new Date().toISOString().split('T')[0],
        exercises
    }
}

router.post('/start', (req, res) => {
    if (isRunning) 
        return res.status(400).json({ error: 'Generator is already running' })

    const plans = req.app.locals.plans
    const interval = req.body.interval || 2000

    isRunning = true

    generatorInterval = setInterval(() => {
        const newPlan = generatePlan(plans)
        plans.push(newPlan)

        if (req.app.locals.broadcast) {
        req.app.locals.broadcast({
            type: 'NEW_PLANS',
            plans
        })
        }
    }, interval)

    res.json({ message: 'Generator started', interval })
})

router.post('/stop', (req, res) => {
    if (!isRunning) 
        return res.status(400).json({ error: 'Generator is not running' })

    clearInterval(generatorInterval)
    generatorInterval = null
    isRunning = false

    res.json({ message: 'Generator stopped' })
})

router.get('/status', (req, res) => {
    res.json({ isRunning })
})

module.exports = router