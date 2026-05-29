'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'securityQuestion', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('Users', 'securityAnswer', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'securityQuestion')
    await queryInterface.removeColumn('Users', 'securityAnswer')
  }
}