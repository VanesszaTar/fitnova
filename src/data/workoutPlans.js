export const availableExercises = [
  { id: 1, name: "Bench Press", muscle: "Chest" },
  { id: 2, name: "Incline Dumbbell Press", muscle: "Chest" },
  { id: 3, name: "Cable Fly", muscle: "Chest" },
  { id: 4, name: "Overhead Press", muscle: "Shoulders" },
  { id: 5, name: "Lateral Raises", muscle: "Shoulders" },
  { id: 6, name: "Front Raises", muscle: "Shoulders" },
  { id: 7, name: "Pull Ups", muscle: "Back" },
  { id: 8, name: "Barbell Row", muscle: "Back" },
  { id: 9, name: "Lat Pulldown", muscle: "Back" },
  { id: 10, name: "Deadlift", muscle: "Back" },
  { id: 11, name: "Squat", muscle: "Legs" },
  { id: 12, name: "Leg Press", muscle: "Legs" },
  { id: 13, name: "Romanian Deadlift", muscle: "Legs" },
  { id: 14, name: "Leg Curl", muscle: "Legs" },
  { id: 15, name: "Calf Raises", muscle: "Legs" },
  { id: 16, name: "Tricep Pushdown", muscle: "Triceps" },
  { id: 17, name: "Skull Crushers", muscle: "Triceps" },
  { id: 18, name: "Dips", muscle: "Triceps" },
  { id: 19, name: "Bicep Curl", muscle: "Biceps" },
  { id: 20, name: "Hammer Curl", muscle: "Biceps" },
  { id: 21, name: "Plank", muscle: "Core" },
  { id: 22, name: "Crunches", muscle: "Core" },
  { id: 23, name: "Leg Raises", muscle: "Core" },
  { id: 24, name: "Burpees", muscle: "Full Body" },
  { id: 25, name: "Mountain Climbers", muscle: "Full Body" },
]

export const initialPlans = [
  {
    id: 1,
    name: "Push Day A",
    description: "Chest, shoulders and triceps focus",
    status: "Active",
    created: "Mar 1, 2026",
    exercises: [
      { id: 1, name: "Bench Press", muscle: "Chest · Primary", sets: 4, reps: 10, rest: 2, met: 6.0 },
      { id: 2, name: "Overhead Press", muscle: "Shoulders · Primary", sets: 4, reps: 8, rest: 2, met: 5.5 },
      { id: 3, name: "Incline Dumbbell Press", muscle: "Chest · Secondary", sets: 3, reps: 12, rest: 1.5, met: 5.0 },
      { id: 4, name: "Lateral Raises", muscle: "Shoulders · Isolation", sets: 3, reps: 15, rest: 1, met: 4.0 },
      { id: 5, name: "Tricep Pushdown", muscle: "Triceps · Isolation", sets: 3, reps: 12, rest: 1, met: 4.5 },
    ]
  },
  {
    id: 2,
    name: "Pull Day B",
    description: "Back and biceps hypertrophy",
    status: "Inactive",
    created: "Feb 22, 2026",
    exercises: [
      { id: 1, name: "Pull Ups", muscle: "Back · Primary", sets: 4, reps: 8, rest: 2, met: 6.0 },
      { id: 2, name: "Barbell Row", muscle: "Back · Primary", sets: 4, reps: 10, rest: 2, met: 5.5 },
      { id: 3, name: "Bicep Curl", muscle: "Biceps · Isolation", sets: 3, reps: 12, rest: 1, met: 4.0 },
      { id: 4, name: "Face Pulls", muscle: "Rear Delt · Isolation", sets: 3, reps: 15, rest: 1, met: 3.5 },
      { id: 5, name: "Hammer Curl", muscle: "Biceps · Isolation", sets: 3, reps: 12, rest: 1, met: 4.0 },
    ]
  },
  {
    id: 3,
    name: "Leg Day",
    description: "Quads, hamstrings and glutes",
    status: "Inactive",
    created: "Feb 15, 2026",
    exercises: [
      { id: 1, name: "Squat", muscle: "Quads · Primary", sets: 4, reps: 8, rest: 3, met: 7.0 },
      { id: 2, name: "Romanian Deadlift", muscle: "Hamstrings · Primary", sets: 4, reps: 10, rest: 2, met: 6.5 },
      { id: 3, name: "Leg Press", muscle: "Quads · Secondary", sets: 3, reps: 12, rest: 2, met: 5.5 },
      { id: 4, name: "Leg Curl", muscle: "Hamstrings · Isolation", sets: 3, reps: 12, rest: 1, met: 4.5 },
      { id: 5, name: "Calf Raises", muscle: "Calves · Isolation", sets: 4, reps: 15, rest: 1, met: 3.5 },
    ]
  },
  {
    id: 4,
    name: "Full Body",
    description: "Compound movements, 3x per week",
    status: "Inactive",
    created: "Feb 10, 2026",
    exercises: [
      { id: 1, name: "Deadlift", muscle: "Back · Primary", sets: 4, reps: 6, rest: 3, met: 7.5 },
      { id: 2, name: "Bench Press", muscle: "Chest · Primary", sets: 3, reps: 8, rest: 2, met: 6.0 },
      { id: 3, name: "Squat", muscle: "Quads · Primary", sets: 3, reps: 8, rest: 2, met: 7.0 },
      { id: 4, name: "Pull Ups", muscle: "Back · Secondary", sets: 3, reps: 8, rest: 2, met: 6.0 },
      { id: 5, name: "Overhead Press", muscle: "Shoulders · Primary", sets: 3, reps: 8, rest: 2, met: 5.5 },
    ]
  },
  {
    id: 5,
    name: "Upper Body",
    description: "Strength focused upper split",
    status: "Inactive",
    created: "Jan 26, 2026",
    exercises: [
      { id: 1, name: "Bench Press", muscle: "Chest · Primary", sets: 5, reps: 5, rest: 3, met: 6.5 },
      { id: 2, name: "Barbell Row", muscle: "Back · Primary", sets: 5, reps: 5, rest: 3, met: 6.0 },
      { id: 3, name: "Overhead Press", muscle: "Shoulders · Primary", sets: 4, reps: 6, rest: 2, met: 5.5 },
      { id: 4, name: "Pull Ups", muscle: "Back · Secondary", sets: 4, reps: 6, rest: 2, met: 6.0 },
      { id: 5, name: "Dips", muscle: "Triceps · Compound", sets: 3, reps: 10, rest: 2, met: 5.0 },
      { id: 6, name: "Bicep Curl", muscle: "Biceps · Isolation", sets: 3, reps: 12, rest: 1, met: 4.0 },
    ]
  },
  {
    id: 6,
    name: "HIIT Cardio",
    description: "High intensity interval training",
    status: "Inactive",
    created: "Jan 20, 2026",
    exercises: [
      { id: 1, name: "Burpees", muscle: "Full Body", sets: 4, reps: 15, rest: 1, met: 8.0 },
      { id: 2, name: "Jump Squats", muscle: "Legs · Explosive", sets: 4, reps: 15, rest: 1, met: 7.5 },
      { id: 3, name: "Mountain Climbers", muscle: "Core · Cardio", sets: 4, reps: 20, rest: 1, met: 7.0 },
    ]
  },
  {
    id: 7,
    name: "Core & Abs",
    description: "Core strength and stability",
    status: "Inactive",
    created: "Jan 15, 2026",
    exercises: [
      { id: 1, name: "Plank", muscle: "Core · Isometric", sets: 4, reps: 1, rest: 1, met: 4.0 },
      { id: 2, name: "Crunches", muscle: "Abs · Primary", sets: 4, reps: 20, rest: 1, met: 3.5 },
      { id: 3, name: "Leg Raises", muscle: "Lower Abs", sets: 3, reps: 15, rest: 1, met: 4.0 },
    ]
  },
]

export function validatePlan(plan) {
  const errors = {}
  if (!plan.name || plan.name.trim() === '') {
    errors.name = 'Plan name is required'
  } 
  if (!plan.description || plan.description.trim() === '') {
    errors.description = 'Description is required'
  }
  return errors
}