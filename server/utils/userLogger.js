const { UserLog, User, Role } = require('../models')

async function logAction(userId, action) {
  if (process.env.NODE_ENV === 'test') return 

  try {
    const user = await User.findByPk(userId, {
      include: [{ model: Role }]
    })
    if (!user) return

    await UserLog.create({
      userId: user.id,
      groupId: user.roleId || 0,
      role: user.Role?.name === 'admin' ? 'ADMIN' : 'USER',
      action
    })
  } catch (err) {
    console.error('UserLog error:', err.message)
  }
}

module.exports = logAction