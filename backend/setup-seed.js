/**
 * Setup script: generates proper bcrypt hashes for seed users
 * Run: node setup-seed.js
 */
const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('='.repeat(60));
  console.log('Leave Platform — Seed Password Hash');
  console.log('='.repeat(60));
  console.log(`Password: ${password}`);
  console.log(`Hash:     ${hash}`);
  console.log('');
  console.log('Replace the placeholder hashes in backend/src/db/init.sql');
  console.log('with the hash above for all demo users.');
  console.log('');
  console.log('Or run this SQL on your PostgreSQL to update them:');
  console.log(`UPDATE users SET password_hash = '${hash}';`);
  console.log('='.repeat(60));
}

generateHashes();
