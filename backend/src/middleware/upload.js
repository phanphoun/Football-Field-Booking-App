const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const serverConfig = require('../config/serverConfig');
const { ValidationError } = require('./errorHandler');

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

const fileFilter = (req, file, cb) => {
  if (serverConfig.isAllowedImageUpload(file)) return cb(null, true);
  return cb(new ValidationError(`Invalid file type: ${file.mimetype}`));
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
  avatarUpload
};
