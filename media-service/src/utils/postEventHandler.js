import { deleteFromCloudinary } from "./cloudinary.js";
import Media from "../models/media.model.js";
import logger from './logger.js';

export const eventHandler = async (event) => {
    try {
        console.log(event);
        const { postId, mediaIds } = event;
        
        const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
        console.log(mediaToDelete);
        for(const media of mediaToDelete) {
            await deleteFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);
    
            logger.info(`Deleted Media with ${media._id} associated with post ID ${postId}`);
        }
    } catch (error) {
        logger.info('Error in eventHandler', {
            error: error.message,
            stack: error.stack
        })
    }
}
