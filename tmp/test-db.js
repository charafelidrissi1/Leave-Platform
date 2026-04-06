const { Pool } = require('pg');
const pools = [
  { user: 'leave_admin', password: 'CHANGE_THIS_STRONG_PASSWORD', database: 'leave_platform' },
  { user: 'postgres', password: '', database: 'postgres' },
  { user: 'postgres', password: 'password', database: 'postgres' }
];

async function test() {
  for (const config of pools) {
    console.log(`Testing ${config.user}@${config.database}...`);
    const pool = new Pool({ ...config, host: 'localhost', port: 5432, connectionTimeoutMillis: 2000 });
    try {
      const res = await pool.query('SELECT NOW()');
      console.log(`✅ Success for ${config.user}`);
      pool.end();
      return;
    } catch (err) {
      console.log(`❌ Failed for ${config.user}: ${err.message}`);
    }
    pool.end();
  }
}

test();
