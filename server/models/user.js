'use strict';
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Plan, { foreignKey: 'userId', as: 'plans' })
      User.belongsTo(models.Role, { foreignKey: 'roleId' })
      User.hasMany(models.RefreshToken, { foreignKey: 'userId' })
      User.hasMany(models.PasswordResetToken, { foreignKey: 'userId' })
      User.hasMany(models.TwoFactorCode, { foreignKey: 'userId' })
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING,
    age: DataTypes.INTEGER,
    gender: DataTypes.STRING,
    height: DataTypes.FLOAT,
    weight: DataTypes.FLOAT,
    fitnessLevel: DataTypes.STRING,
    goal: DataTypes.STRING,
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    securityQuestion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    securityAnswer: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};