import express from "express";
import { Redis } from "ioredis";
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from "./utils/logger.js";
import { RedisStore } from 'rate-limit-redis'
import { globalErrorHandler } from "./middleware/errorHandler.js";
import proxy from "express-http-proxy";
import { verifyToken } from "./middleware/authMiddleware.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const redisClient = new Redis(
    process.env.REDIS_URL,
)


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
    ipv6Subnet: 56,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

app.use(limiter);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request for ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
})

const proxyOptions = {
  proxyReqPathResolver: function (req, res) {
    logger.info(`Proxy request for ${req.method} ${req.originalUrl}`);
    const newUrl = req.originalUrl.replace(/\/v1/, '/api');
    return newUrl;
  },

  proxyErrorHandler: function (err, _ , res, next) {
    logger.error(`Proxy error: ${err.message}`);
    // Use 502 for downstream failure instead of 500
    res.status(502).json({
      error: 'Something went wrong with the proxy',
      message: err.message,
      statusCode: 502
    });
  }
};

// setup proxy for route /v1/auth
app.use(
  '/v1/auth',
  proxy(process.env.DETAILS_URL, {
      ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers = proxyReqOpts.headers || {};
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      try {
        const dataString = proxyResData.toString('utf8'); // buffer → string
        logger.info(
          `Proxy response [${proxyRes.statusCode}] for ${userReq.method} ${userReq.originalUrl} | Body: ${dataString}`
        );
        return proxyResData;
      } catch (err) {
        logger.error('Error logging proxy response', err);
        return proxyResData; // still return so client gets response
      }
    }
  })
);

// setup proxy setup for router /v1/posts
app.use('/v1/posts',
  verifyToken
  , proxy(process.env.POST_URL, {
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user;
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    console.log(proxyReqOpts.headers)
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    try {
      const dataString = proxyResData.toString('utf8'); // buffer → string
      logger.info(
        `Proxy response [${proxyRes.statusCode}] for ${userReq.method} ${userReq.originalUrl} | Body: ${dataString}`
      );
      return proxyResData;
    } catch (err) {
      logger.error('Error logging proxy response', err);
      return proxyResData; // still return so client gets response
    }
  }
})
)

app.use('/v1/media', verifyToken, proxy(process.env.MEDIA_URL, {
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (!srcReq.header('Content-Type').startsWith('multipart/form-data')) {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
    }
    proxyReqOpts.headers['x-user-id'] = srcReq.user;
    return proxyReqOpts;
  },

  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    try {
      const dataString = proxyResData.toString('utf8'); // buffer → string
      logger.info(
        `Proxy response [${proxyRes.statusCode}] for ${userReq.method} ${userReq.originalUrl} | Body: ${dataString}`
      );
      return proxyResData;
    } catch (err) {
      logger.error('Error logging proxy response', err);
      return proxyResData; // still return so client gets response
    }
  },

  parseReqBody: false
}))

app.use('/v1/search', verifyToken, proxy(process.env.MEDIA_URL, {
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (!srcReq.header('Content-Type').startsWith('multipart/form-data')) {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
    }
    proxyReqOpts.headers['x-user-id'] = srcReq.user;
    return proxyReqOpts;
  },

  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    try {
      const dataString = proxyResData.toString('utf8'); // buffer → string
      logger.info(
        `Proxy response [${proxyRes.statusCode}] for ${userReq.method} ${userReq.originalUrl} | Body: ${dataString}`
      );
      return proxyResData;
    } catch (err) {
      logger.error('Error logging proxy response', err);
      return proxyResData; // still return so client gets response
    }
  },

  parseReqBody: false
}))

// Add a catch-all route for debugging
app.use((req, res) => {
  logger.error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler should be placed after all routes
app.use(globalErrorHandler);

app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on port: ${process.env.DETAILS_URL}`);
    logger.info(`Redis URL: ${process.env.REDIS_URL}`);
    logger.info(`Post service is running on port: ${process.env.POST_URL}`);
    logger.info(`Media service is running on port: ${process.env.MEDIA_URL}`);
})

process.on('unhandledRejection', (promise, reason) => {
  logger.error(`unhandleed rejection at: ${promise} and reason: ${reason}`)
})