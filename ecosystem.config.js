module.exports = {
  apps: [
    {
      name: 'leave-platform-api',
      script: './backend/src/server.js',
      cwd: '/opt/leave-platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_file: '/opt/leave-platform/backend/.env',
      watch: false,
      max_memory_restart: '300M',
      error_file: '/var/log/leave-platform/error.log',
      out_file: '/var/log/leave-platform/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
