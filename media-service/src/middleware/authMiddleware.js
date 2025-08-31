import logger from '../utils/logger.js';

export const getUserByHeader = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    console.log(userId);
    if (!userId) {
        logger.error('cannot find userId in headers');
        res.status(401).json({
            message: 'cannot find userId in headers',
            success: false,
            statusCode: 401    
        })
    }

    req.user = {userId};
    next();
}