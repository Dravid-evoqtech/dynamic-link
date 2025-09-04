module.exports = {
  apps: [{
    name: 'futurefind-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      ENABLE_CRON_JOBS: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      ENABLE_CRON_JOBS: 'true'
    },
    cron_restart: '0 4 * * *',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
