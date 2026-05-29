'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, { foreignKey: 'roleId' })
      RolePermission.belongsTo(models.Permission, { foreignKey: 'permissionId' })
    }
  }
  RolePermission.init({
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, { sequelize, modelName: 'RolePermission'});
  return RolePermission;
};