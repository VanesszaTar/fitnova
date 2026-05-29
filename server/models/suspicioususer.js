'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class SuspiciousUser extends Model {
    static associate(models) {
      SuspiciousUser.belongsTo(models.User, { foreignKey: 'userId' })
    }
  }
  SuspiciousUser.init({
    userId: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    actionCount: { type: DataTypes.INTEGER, allowNull: false },
    detectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { sequelize, modelName: 'SuspiciousUser' })
  return SuspiciousUser
}