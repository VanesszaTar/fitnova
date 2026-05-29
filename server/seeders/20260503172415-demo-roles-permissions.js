'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [
      { name: 'admin', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user', createdAt: new Date(), updatedAt: new Date() }
    ])

    await queryInterface.bulkInsert('Permissions', [
      { name: 'manage_users', createdAt: new Date(), updatedAt: new Date() },
      { name: 'manage_plans', createdAt: new Date(), updatedAt: new Date() },
      { name: 'view_stats', createdAt: new Date(), updatedAt: new Date() },
      { name: 'delete_any_plan', createdAt: new Date(), updatedAt: new Date() },
      { name: 'view_all_users', createdAt: new Date(), updatedAt: new Date() }
    ])

    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Roles"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Permissions"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    const roleId = (name) => roles.find(r => r.name === name).id
    const permId = (name) => permissions.find(p => p.name === name).id

    await queryInterface.bulkInsert('RolePermissions', [
      { roleId: roleId('admin'), permissionId: permId('manage_users'), createdAt: new Date(), updatedAt: new Date() },
      { roleId: roleId('admin'), permissionId: permId('manage_plans'), createdAt: new Date(), updatedAt: new Date() },
      { roleId: roleId('admin'), permissionId: permId('view_stats'), createdAt: new Date(), updatedAt: new Date() },
      { roleId: roleId('admin'), permissionId: permId('delete_any_plan'), createdAt: new Date(), updatedAt: new Date() },
      { roleId: roleId('admin'), permissionId: permId('view_all_users'), createdAt: new Date(), updatedAt: new Date() },

      { roleId: roleId('user'), permissionId: permId('manage_plans'), createdAt: new Date(), updatedAt: new Date() },
      { roleId: roleId('user'), permissionId: permId('view_stats'), createdAt: new Date(), updatedAt: new Date() }
    ])

    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    for (const user of users) {
      const role = user.email === 'alex@example.com' ? 'admin' : 'user'
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET "roleId" = ${roleId(role)} WHERE id = ${user.id}`
      )
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {})
    await queryInterface.bulkDelete('Permissions', null, {})
    await queryInterface.bulkDelete('Roles', null, {})
    await queryInterface.sequelize.query('UPDATE "Users" SET "roleId" = NULL')
  }
}