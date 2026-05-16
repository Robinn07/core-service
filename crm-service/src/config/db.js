require('dotenv').config();
const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 50,
    min: 5,
    acquire: 60000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
