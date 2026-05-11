module.exports = {
  apps: [
    {
      name: 'getloopx-ingestion',
      script: 'ingestion-service/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/ingestion_err.log',
      out_file: 'logs/ingestion_out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'getloopx-worker',
      script: 'ingestion-service/worker.py',
      interpreter: 'analytics-service/venv/Scripts/python.exe',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: 'logs/worker_err.log',
      out_file: 'logs/worker_out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'getloopx-analytics',
      script: 'analytics-service/venv/Scripts/uvicorn.exe',
      args: 'main:app --host 0.0.0.0 --port 8080 --workers 4',
      cwd: 'analytics-service',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_production: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: 'logs/analytics_err.log',
      out_file: 'logs/analytics_out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'getloopx-email',
      script: 'email-service/src/server.js',
      instances: 2,
      autorestart: true,
      watch: false,
      env_production: {
        PORT: 3001
      },
      error_file: 'logs/email_err.log',
      out_file: 'logs/email_out.log'
    }
  ]
};
