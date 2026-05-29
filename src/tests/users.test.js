import { describe, it, expect, beforeEach } from 'vitest'
import { users, validateRegister, validateLogin, registerUser, loginUser } from '../data/users'

// Reset users array before each test
beforeEach(() => {
  users.length = 0
  users.push({
    id: 1,
    firstName: 'Alex',
    lastName: 'Smith',
    age: 22,
    gender: 'Male',
    email: 'alex@example.com',
    password: 'PAssword1!'
  })
})

// ── VALIDATE REGISTER ──
describe('validateRegister', () => {

  const validForm = {
    firstName: 'John',
    lastName: 'Doe',
    age: '20',
    gender: 'Male',
    email: 'john@example.com',
    password: 'PAssword1!',
    confirmPassword: 'PAssword1!'
  }

  it('passes with valid data', () => {
    const errors = validateRegister(validForm)
    expect(errors).toEqual({})
  })

  it('fails when first name is empty', () => {
    const errors = validateRegister({ ...validForm, firstName: '' })
    expect(errors.firstName).toBeDefined()
  })

  it('fails when first name has spaces', () => {
    const errors = validateRegister({ ...validForm, firstName: 'John Doe' })
    expect(errors.firstName).toBeDefined()
  })

  it('fails when last name is empty', () => {
    const errors = validateRegister({ ...validForm, lastName: '' })
    expect(errors.lastName).toBeDefined()
  })

  it('fails when last name has spaces', () => {
    const errors = validateRegister({ ...validForm, lastName: 'Van Der Berg' })
    expect(errors.lastName).toBeDefined()
  })

  it('fails when age is missing', () => {
    const errors = validateRegister({ ...validForm, age: '' })
    expect(errors.age).toBeDefined()
  })

  it('fails when age is negative', () => {
    const errors = validateRegister({ ...validForm, age: -1})
    expect(errors.age).toBeDefined()
  })

  it('fails when age is not a number', () => {
    const errors = validateRegister({ ...validForm, age: 'abc' })
    expect(errors.age).toBeDefined()
  })

  it('fails when age is 13', () => {
    const errors = validateRegister({ ...validForm, age: '13' })
    expect(errors.age).toBeDefined()
  })

  it('passes when age is exactly 14', () => {
    const errors = validateRegister({ ...validForm, age: '14' })
    expect(errors.age).toBeUndefined()
  })

  it('fails when gender is not selected', () => {
    const errors = validateRegister({ ...validForm, gender: '' })
    expect(errors.gender).toBeDefined()
  })

  it('fails when email is empty', () => {
    const errors = validateRegister({ ...validForm, email: '' })
    expect(errors.email).toBeDefined()
  })

  it('fails when email has no @', () => {
    const errors = validateRegister({ ...validForm, email: 'johnexample.com' })
    expect(errors.email).toBeDefined()
  })

  it('fails when email does not end with .com', () => {
    const errors = validateRegister({ ...validForm, email: 'john@example.ro' })
    expect(errors.email).toBeDefined()
  })

  it('fails when email is already registered', () => {
    const errors = validateRegister({ ...validForm, email: 'alex@example.com' })
    expect(errors.email).toBeDefined()
  })

  it('fails when password is empty', () => {
    const errors = validateRegister({ ...validForm, password: '', confirmPassword: '' })
    expect(errors.password).toBeDefined()
  })

  it('fails when password is too short', () => {
    const errors = validateRegister({ ...validForm, password: 'Pass1!', confirmPassword: 'Pass1!' })
    expect(errors.password).toBeDefined()
  })

  it('fails when password has less than 2 uppercase letters', () => {
    const errors = validateRegister({ ...validForm, password: 'password1!a', confirmPassword: 'password1!a' })
    expect(errors.password).toBeDefined()
  })

  it('fails when password has no digit', () => {
    const errors = validateRegister({ ...validForm, password: 'PAssword!!a', confirmPassword: 'PAssword!!a' })
    expect(errors.password).toBeDefined()
  })

  it('fails when password has no special character', () => {
    const errors = validateRegister({ ...validForm, password: 'PAssword123', confirmPassword: 'PAssword123' })
    expect(errors.password).toBeDefined()
  })

  it('fails when passwords do not match', () => {
    const errors = validateRegister({ ...validForm, confirmPassword: 'Different1!' })
    expect(errors.confirmPassword).toBeDefined()
  })

  it('fails when confirm password is empty', () => {
    const errors = validateRegister({ ...validForm, confirmPassword: '' })
    expect(errors.confirmPassword).toBeDefined()
  })
})

// ── VALIDATE LOGIN ──
describe('validateLogin', () => {

  it('passes with valid data', () => {
    const errors = validateLogin({ email: 'alex@example.com', password: 'PAssword1!' })
    expect(errors).toEqual({})
  })

  it('fails when email is empty', () => {
    const errors = validateLogin({ email: '', password: 'PAssword1!' })
    expect(errors.email).toBeDefined()
  })

  it('fails when password is empty', () => {
    const errors = validateLogin({ email: 'alex@example.com', password: '' })
    expect(errors.password).toBeDefined()
  })
})

// ── REGISTER USER ──
describe('registerUser', () => {

  it('adds a new user to the array', () => {
    const initialLength = users.length
    registerUser({
      firstName: 'Jane',
      lastName: 'Doe',
      age: 25,
      gender: 'Female',
      email: 'jane@example.com',
      password: 'PAssword1!'
    })
    expect(users.length).toBe(initialLength + 1)
  })

  it('stores the correct user data', () => {
    const newUser = registerUser({
      firstName: 'Jane',
      lastName: 'Doe',
      age: 25,
      gender: 'Female',
      email: 'jane@example.com',
      password: 'PAssword1!'
    })
    expect(newUser.firstName).toBe('Jane')
    expect(newUser.email).toBe('jane@example.com')
    expect(newUser.age).toBe(25)
  })

  it('assigns a unique id', () => {
    const newUser = registerUser({
      firstName: 'Jane',
      lastName: 'Doe',
      age: 25,
      gender: 'Female',
      email: 'jane@example.com',
      password: 'PAssword1!'
    })
    expect(newUser.id).toBeDefined()
    expect(newUser.id).toBeGreaterThan(0)
  })
})

// ── LOGIN USER ──
describe('loginUser', () => {

  it('returns user with correct credentials', () => {
    const user = loginUser('alex@example.com', 'PAssword1!')
    expect(user).not.toBeNull()
    expect(user.firstName).toBe('Alex')
  })

  it('returns null with wrong password', () => {
    const user = loginUser('alex@example.com', 'wrongpassword')
    expect(user).toBeNull()
  })

  it('returns null with wrong email', () => {
    const user = loginUser('wrong@example.com', 'PAssword1!')
    expect(user).toBeNull()
  })

  it('returns null with both wrong', () => {
    const user = loginUser('wrong@example.com', 'wrongpassword')
    expect(user).toBeNull()
  })
})