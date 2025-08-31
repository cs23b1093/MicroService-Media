import User from "../database/models/user.model.js";
import { validateUserData } from "../utils/user.validation.js";
import { validateLoginData } from "../utils/user.validation.js";
import generateToken from "../utils/generateToken.js"; 
import logger from "../utils/logger.js";
import { ApiError } from "../utils/errorForamt.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { log } from "console";

const Register = asyncHandler(async (req, res, next) => {
    try {
        logger.info('Register endpoint hits...')
    
        // validate user creditianls
        const error = validateUserData(req.body);
        if (error) {
            logger.error(error.details[0].message);
            const error = new ApiError({ message: error.details[0].message, status: 400, error: error })
            res.status(400).json({
                ...error 
            })
        }
    
        // Checking is User alrady exist or not
        const { username, email, password } = req.body
        const isUserAlreadyExist = await User.findOne({ $or: [{ username }, { email }] })
        if(isUserAlreadyExist) {
            logger.error('User already exist')
            throw new ApiError({ message: 'User already exist', status: 400 })
        }
    
        // creating user 
        const user = new User({
            username,
            email,
            password
        })
        await user.save()
        if(!user) {
            logger.error('User not created');
            const error = new ApiError({ message: 'User not created', status: 400, error: error })
            res.status(400).json({
                ...error 
            })
        } 
        res.status(201).json({
            message: `User with ${username} created successfully`,
            success: true,
            statusCode: 201
        })
        const { accessToken, refreshToken } = await generateToken(user._id);
    } catch (error) {
        logger.error(`Register failed: unexpected error: ${error.message}}`, {
            errorMessage: error?.message,
            stack: error?.stack,
            path: req.originalUrl,
            method: req.method,
            bodyKeys: Object.keys(req.body || {})
        })
        return next(new ApiError({ message: `Internal server error while registering user: ${error.message}}`, status: 500, error }));
    }
})

const Login = asyncHandler((async (req, res) => {
    try {
        // validate user creditianls
        logger.info('Login endpoint hits...')
        const error = validateLoginData(req.body);
        logger.info(error)
        if (error) {
            logger.error(error.details[0].message);
            const error = new ApiError({ message: error.details[0].message, status: 400, error: error })
            res.status(400).json({
                ...error 
            })
        }

        // Checking is User alrady exist or not
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if (!user) {
            logger.error('User not found')
            const error = new ApiError({ message: 'User not found', status: 400, error: error })
            res.status(400).json({
                ...error ,
                statusCode: 400
            })
        }

        // valid password or not
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.error('Invalid password')
            const error = new ApiError({ message: 'Invalid password', status: 400, error: error })
            res.status(400).json({
                ...error ,
                statusCode: 400
            })
        }
        console.log(user._id);
        // Login the user 
        const { accessToken, refreshToken } = await generateToken(user?._id);

        const secureObject = {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }
        res.cookie('refreshToken', refreshToken, secureObject)
        res.cookie('accessToken', accessToken, secureObject)

        res.status(200).json({
            message: `User with ${username} logged in successfully`,
            success: true,
            statusCode: 200,
            accessToken,
            refreshToken
        })

    } catch (error) {
        logger.error(`Login failed: unexpected error: ${error.message}}`)
        res.status(500).json({
            message: `Internal server error while login user: ${error.message}}`,
            success: false,
            statusCode: 500
        })
    }
}))

const Logout = asyncHandler(async (req, res) => {
    try {
        const user_id = req.user;
        
        const secureObject = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict'
        }
        // Clear access token cookie
        res.clearCookie('accessToken', secureObject);
        
        // Clear refresh token cookie if it exists
        res.clearCookie('refreshToken', secureObject);
        
        // Log successful logout
        logger.info('User logged out successfully', {
            userId: user_id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
        });
        
        return res.status(200).json({
            message: 'Logged out successfully',
            success: true
        });
        
    } catch (error) {
        logger.error('Logout operation failed', {
            error: error.message,
            stack: error.stack,
            userId: req.user,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl
        });
        
        return res.status(500).json({
            message: 'Logout failed due to server error',
            error: 'LOGOUT_ERROR',
            success: false
        });
    }
});

export { Register, Login, Logout };