import multer from 'multer';
import path from 'path';

// Configure storage - use memory storage for processing
const storage = multer.memoryStorage();

// File filter for CSV and JSON files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and JSON files are allowed'), false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  }
});

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'File size exceeds 5MB limit'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Only one file can be uploaded at a time'
      });
    }
    return res.status(400).json({
      success: false,
      data: null,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      data: null,
      message: err.message
    });
  }
  
  next();
};

export default {
  upload,
  handleUploadError
};
