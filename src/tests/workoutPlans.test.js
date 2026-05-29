import { describe, it, expect } from 'vitest'
import { validatePlan, initialPlans } from '../data/workoutPlans'

// ── VALIDATE PLAN ──
describe('validatePlan', () => {

  it('passes with valid data', () => {
    const errors = validatePlan({ name: 'Push Day', description: 'Chest focus' })
    expect(errors).toEqual({})
  })

  it('fails when name is empty', () => {
    const errors = validatePlan({ name: '', description: 'Chest focus' })
    expect(errors.name).toBeDefined()
  })

  it('fails when name is only spaces', () => {
    const errors = validatePlan({ name: '   ', description: 'Chest focus' })
    expect(errors.name).toBeDefined()
  })

  it('fails when description is empty', () => {
    const errors = validatePlan({ name: 'Push Day', description: '' })
    expect(errors.description).toBeDefined()
  })

  it('fails when description is only spaces', () => {
    const errors = validatePlan({ name: 'Push Day', description: '   ' })
    expect(errors.description).toBeDefined()
  })
})

// ── INITIAL PLANS DATA ──
describe('initialPlans', () => {

  it('contains at least one plan', () => {
    expect(initialPlans.length).toBeGreaterThan(0)
  })

  it('each plan has required fields', () => {
    initialPlans.forEach(plan => {
      expect(plan.id).toBeDefined()
      expect(plan.name).toBeDefined()
      expect(plan.description).toBeDefined()
      expect(plan.status).toBeDefined()
      expect(plan.exercises).toBeDefined()
    })
  })

  it('each exercise has required parameters', () => {
    initialPlans.forEach(plan => {
      plan.exercises.forEach(ex => {
        expect(ex.sets).toBeGreaterThan(0)
        expect(ex.reps).toBeGreaterThan(0)
        expect(ex.rest).toBeGreaterThanOrEqual(0)
        expect(ex.met).toBeGreaterThan(0)
      })
    })
  })

  it('only one plan is active at a time', () => {
    const activePlans = initialPlans.filter(p => p.status === 'Active')
    expect(activePlans.length).toBeLessThanOrEqual(1)
  })
})