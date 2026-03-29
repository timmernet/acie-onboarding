/**
 * PM2 ecosystem configuratie.
 *
 * Gebruik:
 *   npm run start        → start applicatie via PM2
 *   npm run stop         → stop PM2-proces
 *   npm run logs         → live logs bekijken
 *   pm2 monit            → realtime monitoring
 *
 * SQLite ondersteunt geen gelijktijdige schrijftransacties vanuit
 * meerdere processen, daarom instances: 1 (fork mode).
 */
module.exports = {
  apps: [
    {
      name: 'onboarding',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',

      // Herstart automatisch bij geheugenlek
      max_memory_restart: '512M',

      // Herstart bij crash, maar niet bij opzettelijk stoppen
      autorestart: true,
      watch: false,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,

      // Wacht maximaal 5s op graceful shutdown
      kill_timeout: 5000,

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
