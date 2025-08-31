import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../database/models/refreshToken.model.js';
import { ApiError } from './errorForamt.js';
import logger from './logger.js';

const generateTokens = async (user_id) => {
    try {
        const accessToken = jwt.sign({
            user_id: user_id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: '1h'})
        console.log(process.env.ACCESS_TOKEN_SECRET);
    
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 7);
    
        const response = new RefreshToken({
            user_id: user_id,
            token: refreshToken,
            expiredAt: expiredAt
        })
        await response.save();
        if(!response) throw new Error('Failed to genrate refresh Token');
        logger.info({"Access Token": accessToken, "Refresh Token": refreshToken,})
        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error: ', error);
    }
}

export default generateTokens;