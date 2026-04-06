const { Pool } = require('pg');
const config = require('./env');

let poolConfig;

if (config.databaseUrl) {
  console.log('🔌 Connecting to database via connection string...');
  poolConfig = {
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for Neon
  };
} else {
  console.log('🔌 Connecting to local database...');
  poolConfig = {
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to database successfully'))
  .catch(err => {
    console.error('❌ Database connection failed at startup:', err.message);
    // Log important part of the connection string for debugging (masked)
    if (config.databaseUrl) {
       const host = config.databaseUrl.split('@')[1]?.split('/')[0];
       console.error(`Attempted to connect to host: ${host}`);
    }
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
