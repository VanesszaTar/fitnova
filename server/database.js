const { Sequelize } = require('sequelize')

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'fitnova',
      process.env.DB_USER || 'vanesszatar',
      process.env.DB_PASS || null,
      { host: '127.0.0.1', dialect: 'postgres', logging: false }
    )

module.exports = sequelize