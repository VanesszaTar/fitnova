'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    static associate(models) {
      RefreshToken.belongsTo(models.User, { foreignKey: 'userId' })
    }
  }

  RefreshToken.init({
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'RefreshToken'
  })

  return RefreshToken
}