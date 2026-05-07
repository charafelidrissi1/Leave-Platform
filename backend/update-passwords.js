const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  try {
    await pool.query('UPDATE users SET password_hash = $1', [hash]);
    console.log('Passwords updated successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
