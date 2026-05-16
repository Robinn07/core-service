module.exports = {
  apps: [
    {
      name: 'crm-api',
      script: 'src/server.js',
      instances: 'max', // Utilize all CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '1G',
      error_file: 'logs/pm2-api-error.log',
      out_file: 'logs/pm2-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'crm-worker-ai',
      script: 'src/server.js', // In our architecture, server.js initializes workers
      instances: 1, // AI workers are usually heavy, start with 1 and scale if needed
      env_production: {
        NODE_ENV: 'production',
        IS_WORKER_ONLY: 'true' // Optional flag if you want to split logic
      },
      max_memory_restart: '2G',
      error_file: 'logs/pm2-worker-error.log',
      out_file: 'logs/pm2-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};
