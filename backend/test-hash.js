const bcrypt = require('bcryptjs');

const hash = '$2a$10$mvr5o8QNC/.xDchtGsbwFeKG137WJ.jKvQMW3PxP5vFPGXbUe7gX6';

async function test() {
  const isMatch = await bcrypt.compare('password123', hash);
  console.log('password123 matches:', isMatch);
}

test();
