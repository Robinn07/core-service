require('dotenv').config();
const { Sequelize } = require('sequelize');

const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('sqlite');

const sequelize = isSqlite 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    })
  : new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(isSqlite ? 'SQLite connected successfully.' : 'PostgreSQL connected successfully.');
    
    // Sync models in dev/test ONLY. NEVER in production.
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Database models synced (Development Mode).');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Don't exit in dev to allow debugging
    if (process.env.NODE_ENV !== 'production') process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
