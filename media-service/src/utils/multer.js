import multer from "multer";
import path from "path";
import logger from "./logger.js";

// Configure multer for memory storage (for cloudinary upload)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    logger.warn(`File upload rejected: ${file.mimetype} not allowed`);
    cb(new Error('Only image, video, and audio files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files at once
  }
});

// Export different upload configurations
export const uploadSingle = upload.single('media');
export const uploadMultiple = upload.array('media', 10);
export const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 },
  { name: 'audio', maxCount: 2 }
]);

export default upload;
