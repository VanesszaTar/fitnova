'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SuspiciousUsers', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reason: { type: Sequelize.STRING, allowNull: false },
      actionCount: { type: Sequelize.INTEGER, allowNull: false },
      detectedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SuspiciousUsers')
  }
}