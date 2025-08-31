import helmet from 'helmet';
import express from 'express';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { CorsInitialisation } from './utils/corsSetup.js'
import { globalErrorHandler } from './middleware/errorHandler.js';
import { rateLimit } from 'express-rate-limit';
import router from './routers/post.router.js';
import dbConnect from './models/db.js';
import { RedisStore } from 'rate-limit-redis';
import rabitMQ from './utils/rabitMQ.js';

dotenv.config();
dbConnect();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redisClient = new Redis(
    process.env.REDIS_URL,
)

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    ipv6Subnet: 56,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

const sensitiveEndpointRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    ipv6Subnet: 56,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

app.use(limiter);

app.use('/api/posts/create-post', sensitiveEndpointRateLimiter);
app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, router);

app.use((req, res) => {
    logger.error(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: 'Route not found',
      method: req.method,
      url: req.originalUrl,
      message: 'The requested endpoint does not exist'
    });
  });

app.use(CorsInitialisation);
app.use(globalErrorHandler);

async function startServer () {
    try {
        await rabitMQ.createChannel();
        app.listen(PORT, () => {
            logger.info()
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`API Gateway is running on port ${process.env.API_GATEWAY_URL}`);
            logger.info(`Identity service is running on port: ${process.env.DETAILS_URL}`);
            logger.info(`Post service is running on port: ${process.env.POST_URL}`)
            logger.info(`Redis URL: ${process.env.REDIS_URL}`);
        })
    } catch (error) {
        logger.error('Error starting server', error);
        process.exit(1);
    }
}

startServer();

process.on('uncaughtException', (promise, reason) => {
    logger.error(`Unhandled rejection at: ${promise} and reason: ${reason}`);
})