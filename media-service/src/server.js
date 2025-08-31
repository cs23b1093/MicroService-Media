import logger from "./utils/logger.js";
import { RedisStore } from 'rate-limit-redis';
import { globalErrorHandler } from "./middleware/errorHandler.js";
import express from "express";
import { CorsInitialisation } from "./utils/corsSetup.js";
import dotenv from 'dotenv';
import helmet from 'helmet';
import dbConnect from './models/db.js';
import { rateLimit } from 'express-rate-limit';
import router from "./routers/media.route.js";
import { Redis } from 'ioredis';
import rabitMQ from "./utils/rabitMQ.js";
import { eventHandler } from "./utils/postEventHandler.js";

const PORT = process.env.PORT || 3003;
dotenv.config();
dbConnect();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

const redisClient = new Redis(
    process.env.REDIS_URL
)

app.use(CorsInitialisation);
app.use(globalErrorHandler);

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

app.use('/api/media/upload', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, router);

app.use('/api/media', sensitiveEndpointRateLimiter, router);

app.use((req, res) => {
    logger.error(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: 'Route not found',
      method: req.method,
      url: req.originalUrl,
      message: 'The requested endpoint does not exist'
    });
  });

async function startServer() {
    await rabitMQ.createChannel();
    await rabitMQ.consumeEvent('post.deleted', eventHandler);

    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        logger.info(`API Gateway is running on port ${process.env.API_GATEWAY_URL}`);
        logger.info(`Identity service is running on port: ${process.env.DETAILS_URL}`);
        logger.info(`Post service is running on port: ${process.env.POST_URL}`)
        logger.info(`Redis URL: ${process.env.REDIS_URL}`);
    })
}

startServer();

// process.on('unhandledRejection', (promise, reason) => {
//     logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
//     process.exit(1)
// })