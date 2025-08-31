import { Post } from "../models/Posts.model.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { validatePostData } from "../utils/post.validation.js";
import { ApiError } from "../utils/errorForamt.js";
import rabitMQ from '../utils/rabitMQ.js';

function generateCacheKey(namespace, id, suffix) {
    return `${namespace}:${id}:${suffix}`;
}

const invalidatePostCaches = async (req, postId) => {
    if (postId) {
        await req.redisClient.del(`post:${postId}`);
    }
    // Invalidate paginated post lists
    const keys = await req.redisClient.keys("posts:*");
    console.log(keys);
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

const createNewPost = asyncHandler(async (req, res, next) => {
    logger.info('Creating new post...');
    const errors = validatePostData(req.body);
    if (errors) {
        logger.error('Validation failed for new post', { ...errors });
        return next(new ApiError(400, 'Validation failed', errors));
    }
    
    const userId = req.user?.userId;

    if (!userId) {
        return next(new ApiError(400, 'User ID is required'));
    }

    const { postTitle, postContent, mediaIds } = req.body;
    const newPost = new Post({
        postTitle,
        postContent,
        mediaIds,
        user: userId
    });
    
    const post = await newPost.save();

    if (!post) {
        return next(new ApiError(500, 'Failed to create post'));
    }
    
    await invalidatePostCaches(req);

    logger.info('Post created successfully');
    res.status(201).json({
        post,
        message: 'Post created successfully',
        success: true,
        statusCode: 201
    });
});

const getAllPosts = asyncHandler(async (req, res, next) => {
    logger.info('Fetching all posts...');
    
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const cacheKey = `posts:${page}:${limit}:${sortBy}:${sortOrder}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
        logger.info('Cached posts found!');
        const parsedData = JSON.parse(cachedPosts);
        return res.status(200).json({
            ...parsedData,
            message: 'Posts fetched successfully from cache',
            success: true,
            statusCode: 200
        })
    }

    const posts = await Post.find()
        .select('postTitle postContent user createdAt updatedAt')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean() // Use .lean() for faster read-only queries
        .exec();
        
    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    const responsePayload = {
        posts,
        pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalPosts,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        }
    };

    await req.redisClient.set(cacheKey, JSON.stringify(responsePayload), "EX", 300);

    logger.info('Posts fetched successfully from DB');
    res.status(200).json({
        ...responsePayload,
        message: 'Posts fetched successfully',
        success: true,
        statusCode: 200
    });
});

// get single post 
const getPost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    
    if (!postId) {
        return next(new ApiError(400, 'Post ID is required'));
    }
    
    logger.info(`Fetching post with ID: ${postId}`);
    
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    if(cachedPost) {
        logger.info('Cached post found!');
        const post = JSON.parse(cachedPost);
        return res.status(200).json({
            post,
            message: 'Post fetched successfully from cache',
            success: true,
            statusCode: 200
        })
    }

    const post = await Post.findById(postId)
        .select('postTitle postContent user createdAt updatedAt')
        .lean()
        .exec();
        
    if (!post) {
        logger.warn(`Post not found with ID: ${postId}`);
        return next(new ApiError(404, 'Post not found'));
    }
    
    await req.redisClient.set(cacheKey, JSON.stringify(post), "EX", 600);

    logger.info('Post fetched successfully from DB');
    res.status(200).json({
        post,
        message: 'Post fetched successfully',
        success: true,
        statusCode: 200
    });
});

// Additional method to get posts by user ID (useful for pub/sub scenarios)
const getPostsByUser = asyncHandler(async (req, res, next) => {
    const userId = req.user?.userId;
    
    if (!userId) {
        return next(new ApiError(400, 'User ID is required'));
    }
    
    logger.info(`Fetching posts for user ID: ${userId}`);
    
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const posts = await Post.find({ user: userId })
        .select('postTitle postContent user createdAt updatedAt')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .exec();
        
    const totalPosts = await Post.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalPosts / limit);
    
    logger.info(`Posts fetched successfully for user ${userId}`);
    res.status(200).json({
        posts,
        pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalPosts,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        message: 'User posts fetched successfully',
        success: true,
        statusCode: 200
    });
});

const deletePost = asyncHandler(async (req, res, next) => {
    const { postId } = req.params;
    const userId = req.user?.userId;

    const existingPost = await Post.findOne({ _id: postId, user: userId });

    if (!existingPost) {
        logger.warn(`Post not found or user not authorized to delete post with ID: ${postId}`);
        return next(new ApiError(404, 'Post not found or user not authorized'));
    }

    await Post.deleteOne({ _id: postId, user: userId });

    // invalidate caches
    await invalidatePostCaches(req, postId);

    // publish event with mediaIds
    await rabitMQ.publishEvent('post.deleted', {
        postId,
        userId: req.user.userId,
        mediaIds: existingPost.mediaIds
    });

    logger.info(`Post with ID: ${postId} deleted successfully`);
    res.status(200).json({
        message: 'Post deleted successfully',
        success: true,
        statusCode: 200
    });

});

export {
    createNewPost,
    getAllPosts,
    getPost,
    getPostsByUser,
    deletePost
}; 