import logger from "../utils/logger.js";
import Media from '../models/media.model.js';
import { validateNewMediaData } from "../utils/user.validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const uploadMedia = asyncHandler(async (req, res) => {
    logger.info('hit uploadMedia...');

    const { originalname, mimetype, buffer } = req.file;
    const error = validateNewMediaData({ originalname, mimetype, buffer });
    if (error) {
        logger.error(error);
        return res.status(400).json({ error });
    }

    const userId = req.user.userId;
    logger.info('start uploading to cloudinary...');
    const uploadOnCloudinaryResult = await uploadOnCloudinary(req.file)
    if (uploadOnCloudinaryResult.error) {
        logger.error(uploadOnCloudinaryResult.error);
        return res.status(400).json({ error: uploadOnCloudinaryResult.error });
    }

    logger.info('file uploaded to cloudinary successfully..., Public ID: ' + uploadOnCloudinaryResult.public_id);

    const media = new Media({
        originalName: uploadOnCloudinaryResult.original_filename,
        mimeType: uploadOnCloudinaryResult.format,
        url: uploadOnCloudinaryResult.url,
        userId: userId,
        publicId: uploadOnCloudinaryResult.public_id
    })
    await media.save();
    console.log(media);

    logger.info('uploaded media details...');
    res.status(201).json({
        message: 'Media uploaded successfully',
        media: media.toObject(),
        success: true,
        statusCode: 201
    })
})

const getAllMedia = asyncHandler(async (req, res, next) => {
    logger.info('Fetching all media from the database...');

    const { page = 1, limit = 10 } = req.query;

    const mediaList = await Media.find()
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .exec();

    const totalMedia = await Media.countDocuments();
    const totalPages = Math.ceil(totalMedia / limit);

    logger.info('Media fetched successfully.');
    res.status(200).json({
        media: mediaList,
        pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalMedia,
            hasNextPage: parseInt(page, 10) < totalPages,
            hasPrevPage: parseInt(page, 10) > 1,
        },
        message: 'Media fetched successfully',
        success: true,
        statusCode: 200
    });
});

export { uploadMedia, getAllMedia }