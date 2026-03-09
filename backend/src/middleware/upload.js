const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const serverConfig = require('../config/serverConfig');
const { ValidationError } = require('./errorHandler');
const { validateUploadFile } = require('../utils/fileValidator');

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const safeExt = (originalName) => {
  const ext = path.extname(originalName || '').toLowerCase();
  return ext && ext.length <= 10 ? ext : '';
};

const makeStorage = (subdirFromReq) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const subdir = subdirFromReq(req);
      const dest = path.join(process.cwd(), serverConfig.upload.destination, subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = safeExt(file.originalname);
      const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      cb(null, `${Date.now()}-${id}${ext}`);
    }
  });

// Enhanced file filter that validates actual file content
const fileFilter = async (req, file, cb) => {
  try {
    const allowed = serverConfig.upload.allowedTypes || [];
    
    // First check: MIME type from client (basic check)
    if (!allowed.includes(file.mimetype)) {
      return cb(new ValidationError(`Invalid file type: ${file.mimetype}`));
    }

    // Will perform deeper validation after file is written
    // This is handled in the post-upload validation
    cb(null, true);
  } catch (error) {
    cb(new ValidationError(`File validation error: ${error.message}`));
  }
};

// Post-upload file validation middleware
const validateUploadedFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Validate actual file content (checks magic numbers)
    const validation = await validateUploadFile(req.file.path);
    
    if (!validation.valid) {
      // Delete invalid file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file content. File does not match declared type.'
      });
    }

    // Attach validation result to request
    req.file.validation = validation;
    next();
  } catch (error) {
    // Delete file if validation fails
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore deletion errors
      }
    }

    res.status(400).json({
      success: false,
      message: `File upload failed: ${error.message}`
    });
  }
};

const limits = { fileSize: serverConfig.upload.maxSize || 5 * 1024 * 1024 };

const fieldImagesUpload = multer({
  storage: makeStorage((req) => path.join('fields', String(req.params.id))),
  fileFilter,
  limits
});

const teamLogoUpload = multer({
  storage: makeStorage((req) => path.join('teams', String(req.params.id))),
  fileFilter,
  limits
});

const avatarUpload = multer({
  storage: makeStorage((req) => path.join('avatars', String(req.user?.id || 'unknown'))),
  fileFilter,
  limits
});

module.exports = {
  fieldImagesUpload,
  teamLogoUpload,
  avatarUpload,
  validateUploadedFile
};
