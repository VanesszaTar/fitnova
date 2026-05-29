'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Exercise extends Model {
    static associate(models) {
      Exercise.belongsTo(models.Plan, { foreignKey: 'planId', as: 'plan' })
    }
  }
  Exercise.init({
    name: DataTypes.STRING,
    muscle: DataTypes.STRING,
    sets: DataTypes.INTEGER,
    reps: DataTypes.INTEGER,
    rest: DataTypes.FLOAT,
    met: DataTypes.FLOAT,
    planId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Exercise'
  });
  return Exercise;
};