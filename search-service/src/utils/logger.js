const winston = require('winston');

const baseFormats = [
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
];

const devFormat = winston.format.combine(
    ...baseFormats,
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} ${level}: ${stack ?? message}${rest}`;
    })
);

const isProduction = process.env.NODE_ENV === 'production';

const transports = [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
];

if (!isProduction) {
    transports.push(new winston.transports.Console({
        level: 'debug',
        format: devFormat,
    }));
}

const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction
        ? winston.format.combine(...baseFormats, winston.format.json())
        : devFormat,
    defaultMeta: { service: 'user-service' },
    transports,
});

module.exports = logger;