const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:!@maynard25AA@localhost:5432/crm_db'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT name FROM "SequelizeMeta"');
    console.log('MIGRATIONS_START');
    console.log(res.rows.map(r => r.name).join('\n'));
    console.log('MIGRATIONS_END');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
