/**
* Logging helper
**/

const winston = require('winston');

const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
	format: winston.format.combine(
		winston.format.colorize({ all: true }),
		winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
		winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
	  ),
    transports: [consoleTransport]
};
const logger = new winston.createLogger(myWinstonOptions);

function logInfo(log)
{
	logger.info(log);
}

function logError(log)
{
	logger.error(log);
}

module.exports = {
	logInfo,
	logError
}