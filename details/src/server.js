import dotenv from 'dotenv';
import express from 'express';
import { customMiddleware } from '../middleware/customMiddleware.js';
// import { errorHandler } from '../middleware/errorHandler.js';
// import logger from '../utils/logger.js';
import redis from 'ioredis';
import dbConnect from '../database/db.js';
import { ApiVersioning } from '../middleware/apiVersioning.js';
import { CorsInitialisation } from '../utils/corsSetup.js';
import { limiter } from '../middleware/rateLimiter.js';
import helmet from 'helmet';
import logger from '../utils/logger.js';
import { rateLimit } from 'express-rate-limit';
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { RedisStore } from 'rate-limit-redis'
import routers from '../routes/user.router.js'
import { globalErrorHandler } from '../middleware/errorHandler.js';
import cookieParser from 'cookie-parser'

dotenv.config();
const redisClient = new redis(
    process.env.REDIS_URL
);


const PORT = process.env.PORT || 3000;

dotenv.config();
const app = express();

dbConnect()
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(CorsInitialisation);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request for ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
})

app.use(customMiddleware);

// app.use(ApiVersioning('v1'));
app.use(limiter(10, 10 * 60 * 1000));
// app.use('/api/v1', routes);

// DDos attack
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rateLimiter',
    points: 8,
    duration: 1
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn('Too many requests from this IP: ' + req.ip + ', please try again later')
        res.status(429).json({
            message: `Too many requests from this IP: ${req.ip}}, please try again later`,
            success: false,
            statusCode: 429
        })
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

app.use('/api/auth/register', sensitiveEndpointRateLimiter);
app.use('/api/auth', routers);

app.use(globalErrorHandler);

app.listen(PORT, () => {
    logger.info('Server is running on port 3000');
    console.log(`Server is running on port ${PORT}`)
})