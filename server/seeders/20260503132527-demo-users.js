'use strict'
const bcrypt = require('bcryptjs')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'Alex',
        lastName: 'Smith',
        age: 22,
        gender: 'Male',
        email: 'alex@example.com',
        password: bcrypt.hashSync('PAssword1!', 10),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Antonia',
        lastName: 'Szalok',
        age: 20,
        gender: 'Female',
        email: 'szalokantonia72@gmail.com',
        password: bcrypt.hashSync('PAssword2!', 10),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {})
  }
}