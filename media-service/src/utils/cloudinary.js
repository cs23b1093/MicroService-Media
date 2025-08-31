import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
    ,secure: true 
});

export const uploadOnCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
            if (error) {
                logger.error('Error uploading file to Cloudinary:', error);
                reject(error);
            } else {
                resolve(result);
            }
        });
        upload.end(file.buffer);
    })
}

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!publicId) {
        const errorMessage = "Public ID is required to delete a file from Cloudinary.";
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    try {
        // The destroy method returns a promise if no callback is provided.
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        // The result object contains `result: 'ok'` on success or `result: 'not found'`.
        if (result.result === 'ok') {
            logger.info(`Successfully deleted resource '${publicId}' (type: ${resourceType}) from Cloudinary.`);
        } else {
            logger.warn(`Cloudinary deletion for '${publicId}' (type: ${resourceType}) completed with result: ${result.result}`);
        }

        return result;
    } catch (error) {
        logger.error(`Error deleting resource '${publicId}' (type: ${resourceType}) from Cloudinary.`, { error });
        throw error;
    }
};

export default cloudinary;