import multer from "multer";

// Memory storage (keeps file buffer in memory)
const storage = multer.memoryStorage();

// File filter (optional — restrict mime types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only jpg, png, mp4 allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});

export default upload;
