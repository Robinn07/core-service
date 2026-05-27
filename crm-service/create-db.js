const { Client } = require('pg');

const connectionString = 'postgres://postgres:!@maynard25AA@localhost:5432/postgres';

async function createDb() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    await client.query('CREATE DATABASE loopx_crm');
    console.log('Database loopx_crm created successfully.');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database loopx_crm already exists.');
    } else {
      console.error('Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
}

createDb();
