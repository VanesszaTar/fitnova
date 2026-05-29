'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class UserLog extends Model {
    static associate(models) {
      UserLog.belongsTo(models.User, { foreignKey: 'userId' })
      UserLog.belongsTo(models.Role, { foreignKey: 'groupId' })
    }
  }
  UserLog.init({
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.TEXT, allowNull: false }
  }, { sequelize, modelName: 'UserLog' })
  return UserLog
}