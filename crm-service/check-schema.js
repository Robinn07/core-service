require('dotenv').config({ path: './.env' });
const { sequelize } = require('./src/config/db');

async function checkSchema() {
  try {
    const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns'");
    console.log('Campaigns table columns:');
    results.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error.message);
    process.exit(1);
  }
}

checkSchema();
