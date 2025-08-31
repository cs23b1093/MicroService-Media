const logger = require('../utils/logger.js');
const { ApiError } = require('../utils/errorForamt.js');

const getUserByHeader = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    logger.debug(`Attempting to authenticate with x-user-id: ${userId}`);

    if (!userId) {
        logger.warn('Authentication failed: x-user-id header is missing.');
        return next(new ApiError(401, 'Unauthorized: User ID is missing from headers.'));
    }

    req.user = { userId };
    next();
};

const authenticateRequest = getUserByHeader;

module.exports = { getUserByHeader, authenticateRequest };