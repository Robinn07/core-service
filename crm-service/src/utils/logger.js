const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: path.join(logDir, 'app.log') },
      level: 'info'
    },
    {
      target: 'pino-pretty',
      options: { colorize: true },
      level: 'info'
    }
  ]
});

const logger = pino(transport);

module.exports = logger;
