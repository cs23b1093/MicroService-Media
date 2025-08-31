import express from 'express';
import { uploadMedia, getAllMedia } from '../controller/media.controller.js';
import logger from '../utils/logger.js';
import { getUserByHeader } from '../middleware/authMiddleware.js';
import upload from '../utils/multer.setup.js';
import multerErrorHandler from '../utils/multerErrorHandler.js';

const router = express.Router();

router.post(
    "/upload",
    getUserByHeader,
    upload.single("file"), 
    multerErrorHandler,    
    uploadMedia            
  );

router.route('/get-all-media').get(getAllMedia);

export default router;