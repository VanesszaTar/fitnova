'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class TwoFactorCode extends Model {
    static associate(models) {
      TwoFactorCode.belongsTo(models.User, { foreignKey: 'userId' })
    }
  }

  TwoFactorCode.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'TwoFactorCode'
  })

  return TwoFactorCode
}