import logger from "./logger.js";
import multer from "multer";

const multerErrorHandler = (err, _ , res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      logger.error("Multer error: ", err);
      return res.status(400).json({
        message: "File upload error",
        error: err.message,
        success: false,
      });
    }
    logger.error("Unknown error: ", err);
    return res.status(500).json({
      message: "Unknown error occurred during file upload",
      error: err.message,
      success: false,
    });
  }
  next();
};

export default multerErrorHandler;
