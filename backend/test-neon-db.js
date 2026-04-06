const db = require('./src/config/database');

async function test() {
  try {
    const res = await db.query('SELECT count(*) FROM users');
    console.log('✅ Connected to Neon! User count:', res.rows[0].count);
    const users = await db.query('SELECT email FROM users');
    console.log('Users in DB:', users.rows.map(u => u.email));
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to connect to Neon:', err.message);
    process.exit(1);
  }
}

test();
