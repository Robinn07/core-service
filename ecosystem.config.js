module.exports = {
  apps: [
    // ── 1. Campaign API (Primary Business Logic) ──────────────────
    {
      name: 'getloopx-campaign-api',
      script: 'src/server.js',
      cwd: 'project-root',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 5000,
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },

    // ── 2. Campaign Worker (Execution & Event Publishing) ──────────
    {
      name: 'getloopx-campaign-worker',
      script: 'src/workers/emailWorker.js',
      cwd: 'project-root',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    },

    // ── 3. Analytics API (Retentioneering Engine) ──────────────────
    {
      name: 'getloopx-analytics-api',
      script: './venv/Scripts/uvicorn.exe',
      args: 'main:app --host 0.0.0.0 --port 8081 --workers 2',
      cwd: 'retentioneering/analytics-service',
      autorestart: true,
      env: {
        PYTHONUNBUFFERED: '1',
        FIREBASE_SERVICE_ACCOUNT: 'serviceAccountKey.json'
      }
    },

    // ── 4. Ingestion API (Event Gateway) ───────────────────────────
    {
      name: 'getloopx-ingestion-api',
      script: 'server.js',
      cwd: 'retentioneering/ingestion-service',
      instances: 1,
      env: {
        PORT: 3000,
        NODE_ENV: 'development'
      }
    },

    // ── 5. Ingestion Worker (ClickHouse Consumer) ──────────────────
    {
      name: 'getloopx-ingestion-worker',
      script: 'worker.py',
      cwd: 'retentioneering/ingestion-service',
      interpreter: 'C:\\Users\\HP\\Desktop\\getloopx-core\\retentioneering\\analytics-service\\venv\\Scripts\\python.exe',
      autorestart: true,
      env: {
        PYTHONUNBUFFERED: '1'
      }
    }
  ]
};
