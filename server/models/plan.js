'use strict';
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Plan extends Model {
    static associate(models) {
      Plan.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      Plan.hasMany(models.Exercise, { foreignKey: 'planId', as: 'exercises' })
    }
  }
  Plan.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    status: DataTypes.STRING,
    created: DataTypes.STRING,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Plan'
  });
  return Plan;
};