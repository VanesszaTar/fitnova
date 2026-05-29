const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Exercise {
    id: Int
    name: String
    muscle: String
    sets: Int
    reps: Int
    rest: Float
    met: Float
  }

  type Plan {
    id: Int
    userId: Int
    name: String
    description: String
    status: String
    created: String
    exercises: [Exercise]
    user: User
  }

  type PaginatedPlans {
    data: [Plan]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type Role {
    id: Int
    name: String
  }

  type User {
    id: Int
    firstName: String
    lastName: String
    email: String
    age: Int
    gender: String
    height: Float
    weight: Float
    fitnessLevel: String
    goal: String
    roleId: Int
    role: Role
    plans: [Plan]
    securityQuestion: String
  }

  # AuthPayload now supports both direct login and 3-way auth flow
  type AuthPayload {
    user: User
    message: String
    token: String
    requiresTwoFactor: Boolean
    userId: Int
  }

  type PlanScore {
    id: Int
    name: String
    status: String
    score: Float
    totalSets: Int
    avgMet: Float
    exerciseCount: Int
  }

  type MuscleDistribution {
    name: String
    count: Int
    percentage: Int
  }

  type PlanStats {
    totalPlans: Int
    totalExercises: Int
    totalSets: Int
    muscleDistribution: [MuscleDistribution]
    plansWithScore: [PlanScore]
  }

  type UserStats {
    totalUsers: Int
    averageAge: Float
    genderDistribution: [GenderCount]
    fitnessLevelDistribution: [FitnessLevelCount]
    goalDistribution: [GoalCount]
  }

  type GenderCount {
    gender: String
    count: Int
  }

  type FitnessLevelCount {
    level: String
    count: Int
  }

  type GoalCount {
    goal: String
    count: Int
  }

  type AvailableExercise {
    id: Int
    name: String
    muscle: String
  }

  type GeneratorStatus {
    isRunning: Boolean
  }

  type GeneratorResult {
    message: String
    interval: Int
  }

  type DeleteResult {
    message: String
  }

  type UserLog {
    id: Int
    userId: Int
    groupId: Int
    role: String
    action: String
    createdAt: String
  }

  type PaginatedUserLogs {
    data: [UserLog]
    total: Int
    page: Int
    limit: Int
    totalPages: Int
  }

  type Query {
    plans(page: Int, limit: Int, status: String, userId: Int): PaginatedPlans
    plan(id: Int!): Plan
    availableExercises: [AvailableExercise]
    planStats(userId: Int): PlanStats
    users(page: Int, limit: Int): [User]
    user(id: Int!): User
    userStats: UserStats
    generatorStatus: GeneratorStatus
    userLogs(page: Int, limit: Int, userId: Int): PaginatedUserLogs
    health: String
  }

  type Mutation {
    createPlan(name: String!, description: String!, userId: Int!, exercises: [ExerciseInput]): Plan
    updatePlan(id: Int!, name: String!, description: String!, userId: Int, exercises: [ExerciseInput]): Plan
    deletePlan(id: Int!, userId: Int): DeleteResult
    activatePlan(id: Int!, userId: Int): Plan
    deleteExercise(planId: Int!, exerciseId: Int!, userId: Int): Plan
    register(
      firstName: String!, lastName: String!, email: String!, password: String!,
      confirmPassword: String!, age: Int!, gender: String!,
      height: Float, weight: Float, fitnessLevel: String, goal: String,
      securityQuestion: String!, securityAnswer: String!
    ): AuthPayload
    login(email: String!, password: String!): AuthPayload
    startGenerator(interval: Int, userId: Int): GeneratorResult
    stopGenerator(userId: Int): DeleteResult
  }

  input ExerciseInput {
    id: Int
    name: String!
    muscle: String!
    sets: Int!
    reps: Int!
    rest: Float!
    met: Float!
  }
`)

module.exports = schema