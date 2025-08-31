import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const verifyToken = (req, res, next) => {
    const authHeader = req.header('authorization');
    const token = authHeader && authHeader.split(" ")[1];
    console.log(token);

    if (!token) {
        logger.warn('No token provided!');
        res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded.user_id;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: err.message,
                error: 'Token expired',
                expiredAt: err.expiredAt.toISOString(),
                decoded: err.decoded,
                
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Forbidden',
            error: 'Invalid token'
        });
    }
};
