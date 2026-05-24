module.exports = {
  apps: [
    {
      name: 'crm-service-staging',
      script: './crm-service/src/app.js',
      instances: 1,                    // single instance for staging
      exec_mode: 'fork',
      env_file: './crm-service/.env.staging',
      env: { NODE_ENV: 'staging' },
      error_file: './logs/staging-crm-error.log',
      out_file: './logs/staging-crm-out.log',
      watch: false
    },
    {
      name: 'ingestion-service-staging',
      script: './retentioneering/ingestion-service/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './retentioneering/ingestion-service/.env.staging',
      env: { NODE_ENV: 'staging' },
      error_file: './logs/staging-ingestion-error.log',
      out_file: './logs/staging-ingestion-out.log',
      watch: false
    }
  ]
};
