export const users = [
  {
    id: 1,
    firstName: 'Alex',
    lastName: 'Smith',
    age: 22,
    gender: 'Male',
    email: 'alex@example.com',
    password: 'PAssword1!'
  }
]
export function validateRegister(formData) {
  const errors = {}

  // First name 
  if (!formData.firstName || formData.firstName.trim() === '') {
    errors.firstName = 'First name is required'
  } else if (/\s/.test(formData.firstName)) {
    errors.firstName = 'First name must not contain spaces'
  }

  // Last name 
  if (!formData.lastName || formData.lastName.trim() === '') {
    errors.lastName = 'Last name is required'
  } else if (/\s/.test(formData.lastName)) {
    errors.lastName = 'Last name must not contain spaces'
  }

  // Age 
  if (!formData.age || formData.age === '') {
    errors.age = 'Age is required'
  } else if (isNaN(formData.age)) {
    errors.age = 'Age must be a number'
  } else if (Number(formData.age) < 0) {
    errors.age = 'Age must be positive'
  } else if (Number(formData.age) < 14) {
    errors.age = 'User must be 14 or older'
  }

  // Gender
  if (!formData.gender || formData.gender === '') {
    errors.gender = 'Please select a gender'
  }

  // Email 
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!formData.email.includes('@') || !formData.email.endsWith('.com')) {
    errors.email = 'Email must contain @ and end with .com'
  } else if (users.find(u => u.email === formData.email)) {
    errors.email = 'This email is already registered'
  }

  // Password 
  if (!formData.password || formData.password === '') {
    errors.password = 'Password is required'
  } else {
    if (formData.password.length < 10) {
      errors.password = 'Password must be at least 10 characters'
    } else if ((formData.password.match(/[A-Z]/g) || []).length < 2) {
      errors.password = 'Password must contain at least 2 uppercase letters'
    } else if (!/\d/.test(formData.password)) {
      errors.password = 'Password must contain at least 1 digit'
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      errors.password = 'Password must contain at least 1 special character'
    }
  }

  // Confirm password
  if (!formData.confirmPassword || formData.confirmPassword === '') {
    errors.confirmPassword = 'Please confirm your password'
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export function validateLogin(formData) {
  const errors = {}

  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required'
  }

  if (!formData.password || formData.password === '') {
    errors.password = 'Password is required'
  }

  return errors
}

export function registerUser(formData) {
  const newUser = {
    id: users.length + 1,
    firstName: formData.firstName,
    lastName: formData.lastName,
    age: Number(formData.age),
    gender: formData.gender,
    email: formData.email,
    password: formData.password,
  }
  users.push(newUser)
  return newUser
}

export function loginUser(email, password) {
  const user = users.find(u => u.email === email && u.password === password)
  return user || null
}