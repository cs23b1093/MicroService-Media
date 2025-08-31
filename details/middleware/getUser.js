import jwt from 'jsonwebtoken';
import { asyncHandler } from './errorHandler.js';
import logger from '../utils/logger.js';

export const getUserByCookies = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers?.authorization?.split(' ')[1] || null;
        console.log(req);
        if (!token) {
            logger.warn('Access Token not found in request', {
                cookies: req.cookies ? Object.keys(req.cookies) : 'none',
                headers: req.headers?.authorization ? 'present' : 'missing',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.originalUrl,
                method: req.method
            });
            
            return res.status(401).json({ 
                message: 'Authentication required',
                error: 'NO_TOKEN_PROVIDED',
                details: 'Please provide a valid access token in cookies or Authorization header'
            });
        }

        const decoder = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoder?.payload?.user_id;
        next();
    } catch (error) {
        logger.error(`JWT verification failed: ${error.message}`, {
            error: error.stack,
            token: token ? `${token.substring(0, 10)}...` : 'null',
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid or expired access token',
                error: 'TOKEN_INVALID'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Access token has expired',
                error: 'TOKEN_EXPIRED'
            });
        } else {
            return res.status(500).json({ 
                message: 'Internal server error during authentication',
                error: 'AUTH_ERROR'
            });
        }
    }
});