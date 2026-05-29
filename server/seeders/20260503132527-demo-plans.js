'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" ORDER BY id ASC LIMIT 2',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    const alexId = users[0].id
    const antoId = users[1].id

    await queryInterface.bulkInsert('Plans', [
      { name: 'Push Day A', description: 'Chest, shoulders and triceps focus', status: 'Active', created: '2026-03-01', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pull Day B', description: 'Back and biceps hypertrophy', status: 'Inactive', created: '2026-02-22', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Leg Day', description: 'Quads, hamstrings and glutes', status: 'Inactive', created: '2026-02-15', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Full Body', description: 'Compound movements, 3x per week', status: 'Inactive', created: '2026-02-10', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Upper Body', description: 'Strength focused upper split', status: 'Inactive', created: '2026-01-26', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'HIIT Cardio', description: 'High intensity interval training', status: 'Inactive', created: '2026-01-20', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Core & Abs', description: 'Core strength and stability', status: 'Inactive', created: '2026-01-15', userId: alexId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Morning Yoga Flow', description: 'Flexibility and mindfulness routine', status: 'Active', created: '2026-04-01', userId: antoId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Beginner Cardio', description: 'Low impact cardio for beginners', status: 'Inactive', created: '2026-04-05', userId: antoId, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Tone & Sculpt', description: 'Full body toning with light weights', status: 'Inactive', created: '2026-04-10', userId: antoId, createdAt: new Date(), updatedAt: new Date() }
    ])

    const plans = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Plans" ORDER BY id ASC',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    const planId = (name) => plans.find(p => p.name === name).id

    await queryInterface.bulkInsert('Exercises', [
      // Push Day A
      { name: 'Bench Press', muscle: 'Chest', sets: 4, reps: 10, rest: 2, met: 6.0, planId: planId('Push Day A'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Overhead Press', muscle: 'Shoulders', sets: 4, reps: 8, rest: 2, met: 5.5, planId: planId('Push Day A'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', sets: 3, reps: 12, rest: 1.5, met: 5.0, planId: planId('Push Day A'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Lateral Raises', muscle: 'Shoulders', sets: 3, reps: 15, rest: 1, met: 4.0, planId: planId('Push Day A'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Tricep Pushdown', muscle: 'Triceps', sets: 3, reps: 12, rest: 1, met: 4.5, planId: planId('Push Day A'), createdAt: new Date(), updatedAt: new Date() },
      // Pull Day B
      { name: 'Pull Ups', muscle: 'Back', sets: 4, reps: 8, rest: 2, met: 6.0, planId: planId('Pull Day B'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Barbell Row', muscle: 'Back', sets: 4, reps: 10, rest: 2, met: 5.5, planId: planId('Pull Day B'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bicep Curl', muscle: 'Biceps', sets: 3, reps: 12, rest: 1, met: 4.0, planId: planId('Pull Day B'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Face Pulls', muscle: 'Rear Delt', sets: 3, reps: 15, rest: 1, met: 3.5, planId: planId('Pull Day B'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hammer Curl', muscle: 'Biceps', sets: 3, reps: 12, rest: 1, met: 4.0, planId: planId('Pull Day B'), createdAt: new Date(), updatedAt: new Date() },
      // Leg Day
      { name: 'Squat', muscle: 'Legs', sets: 4, reps: 8, rest: 3, met: 7.0, planId: planId('Leg Day'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Romanian Deadlift', muscle: 'Legs', sets: 4, reps: 10, rest: 2, met: 6.5, planId: planId('Leg Day'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Leg Press', muscle: 'Legs', sets: 3, reps: 12, rest: 2, met: 5.5, planId: planId('Leg Day'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Leg Curl', muscle: 'Legs', sets: 3, reps: 12, rest: 1, met: 4.5, planId: planId('Leg Day'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Calf Raises', muscle: 'Legs', sets: 4, reps: 15, rest: 1, met: 3.5, planId: planId('Leg Day'), createdAt: new Date(), updatedAt: new Date() },
      // Full Body
      { name: 'Deadlift', muscle: 'Back', sets: 4, reps: 6, rest: 3, met: 7.5, planId: planId('Full Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bench Press', muscle: 'Chest', sets: 3, reps: 8, rest: 2, met: 6.0, planId: planId('Full Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Squat', muscle: 'Legs', sets: 3, reps: 8, rest: 2, met: 7.0, planId: planId('Full Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pull Ups', muscle: 'Back', sets: 3, reps: 8, rest: 2, met: 6.0, planId: planId('Full Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Overhead Press', muscle: 'Shoulders', sets: 3, reps: 8, rest: 2, met: 5.5, planId: planId('Full Body'), createdAt: new Date(), updatedAt: new Date() },
      // Upper Body
      { name: 'Bench Press', muscle: 'Chest', sets: 5, reps: 5, rest: 3, met: 6.5, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Barbell Row', muscle: 'Back', sets: 5, reps: 5, rest: 3, met: 6.0, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Overhead Press', muscle: 'Shoulders', sets: 4, reps: 6, rest: 2, met: 5.5, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pull Ups', muscle: 'Back', sets: 4, reps: 6, rest: 2, met: 6.0, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Dips', muscle: 'Triceps', sets: 3, reps: 10, rest: 2, met: 5.0, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bicep Curl', muscle: 'Biceps', sets: 3, reps: 12, rest: 1, met: 4.0, planId: planId('Upper Body'), createdAt: new Date(), updatedAt: new Date() },
      // HIIT Cardio
      { name: 'Burpees', muscle: 'Full Body', sets: 4, reps: 15, rest: 1, met: 8.0, planId: planId('HIIT Cardio'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Jump Squats', muscle: 'Legs', sets: 4, reps: 15, rest: 1, met: 7.5, planId: planId('HIIT Cardio'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mountain Climbers', muscle: 'Core', sets: 4, reps: 20, rest: 1, met: 7.0, planId: planId('HIIT Cardio'), createdAt: new Date(), updatedAt: new Date() },
      // Core & Abs
      { name: 'Plank', muscle: 'Core', sets: 4, reps: 1, rest: 1, met: 4.0, planId: planId('Core & Abs'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Crunches', muscle: 'Abs', sets: 4, reps: 20, rest: 1, met: 3.5, planId: planId('Core & Abs'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Leg Raises', muscle: 'Core', sets: 3, reps: 15, rest: 1, met: 4.0, planId: planId('Core & Abs'), createdAt: new Date(), updatedAt: new Date() },
      // Morning Yoga Flow
      { name: 'Plank', muscle: 'Core', sets: 3, reps: 1, rest: 1, met: 4.0, planId: planId('Morning Yoga Flow'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Crunches', muscle: 'Core', sets: 3, reps: 20, rest: 1, met: 3.5, planId: planId('Morning Yoga Flow'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Leg Raises', muscle: 'Core', sets: 3, reps: 15, rest: 1, met: 4.0, planId: planId('Morning Yoga Flow'), createdAt: new Date(), updatedAt: new Date() },
      // Beginner Cardio
      { name: 'Burpees', muscle: 'Full Body', sets: 3, reps: 10, rest: 1.5, met: 8.0, planId: planId('Beginner Cardio'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mountain Climbers', muscle: 'Full Body', sets: 3, reps: 15, rest: 1, met: 7.0, planId: planId('Beginner Cardio'), createdAt: new Date(), updatedAt: new Date() },
      // Tone & Sculpt
      { name: 'Lateral Raises', muscle: 'Shoulders', sets: 3, reps: 15, rest: 1, met: 4.0, planId: planId('Tone & Sculpt'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bicep Curl', muscle: 'Biceps', sets: 3, reps: 12, rest: 1, met: 4.0, planId: planId('Tone & Sculpt'), createdAt: new Date(), updatedAt: new Date() },
      { name: 'Calf Raises', muscle: 'Legs', sets: 4, reps: 20, rest: 1, met: 3.5, planId: planId('Tone & Sculpt'), createdAt: new Date(), updatedAt: new Date() }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Exercises', null, {})
    await queryInterface.bulkDelete('Plans', null, {})
  }
}