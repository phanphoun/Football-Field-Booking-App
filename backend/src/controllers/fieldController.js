const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Field, Booking } = require('../models');
const { Op } = require('sequelize');
const serverConfig = require('../config/serverConfig');

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

const getBookedFieldIds = async (fieldIds = []) => {
  if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
    return new Set();
  }

  const activeBookings = await Booking.findAll({
    attributes: ['fieldId'],
    where: {
      fieldId: { [Op.in]: fieldIds },
      status: { [Op.in]: ACTIVE_BOOKING_STATUSES },
      endTime: { [Op.gt]: new Date() }
    },
    group: ['fieldId'],
    raw: true
  });

  return new Set(activeBookings.map((booking) => Number(booking.fieldId)));
};

const attachEffectiveFieldStatus = (field, bookedFieldIds) => {
  const payload = field && typeof field.toJSON === 'function' ? field.toJSON() : field;
  if (!payload) return payload;

  const baseStatus = String(payload.status || 'available').toLowerCase();
  const effectiveStatus =
    baseStatus === 'available' && bookedFieldIds.has(Number(payload.id)) ? 'booked' : baseStatus;

  return {
    ...payload,
    status: effectiveStatus
  };
};

const isManagedFieldImagePath = (imagePath) =>
  typeof imagePath === 'string' && imagePath.startsWith('/uploads/fields/');

const getCandidateImagePaths = (imagePath) => {
  if (!isManagedFieldImagePath(imagePath)) return [];
  const relative = imagePath.slice(1);
  return [
    path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', relative),
    path.resolve(__dirname, '..', '..', 'uploads', 'fields', path.basename(relative))
  ];
};

const removeFieldImageFile = (imagePath) => {
  const candidates = getCandidateImagePaths(imagePath);
  candidates.forEach((absolute) => {
    try {
      if (fs.existsSync(absolute)) {
        fs.unlinkSync(absolute);
      }
    } catch (error) {
      console.warn(`Failed to remove field image file at ${absolute}:`, error.message);
    }
  });
};

const resolvePrimaryFieldImagePath = (imagePath) => {
  if (!isManagedFieldImagePath(imagePath)) return null;
  return path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', imagePath.slice(1));
};

const getFields = async (req, res) => {
  try {
    const fields = await Field.findAll({ where: { isArchived: false } });
    const bookedFieldIds = await getBookedFieldIds(fields.map((field) => field.id));
    res.json({ success: true, data: fields.map((field) => attachEffectiveFieldStatus(field, bookedFieldIds)) });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fields',
      error: error.message
    });
  }
};

const getField = async (req, res) => {
  try {
    const field = await Field.findOne({
      where: {
        id: req.params.id,
        isArchived: false
      }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    const bookedFieldIds = await getBookedFieldIds([field.id]);
    res.json({ success: true, data: attachEffectiveFieldStatus(field, bookedFieldIds) });
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field',
      error: error.message
    });
  }
};

const getMyFields = async (req, res) => {
  try {
    const where = {};

    if (req.user.role !== 'admin') {
      where.ownerId = req.user.id;
    } else if (req.query.ownerId) {
      where.ownerId = req.query.ownerId;
    }
    where.isArchived = false;

    const fields = await Field.findAll({ where });
    const bookedFieldIds = await getBookedFieldIds(fields.map((field) => field.id));
    res.json({ success: true, data: fields.map((field) => attachEffectiveFieldStatus(field, bookedFieldIds)) });
  } catch (error) {
    console.error('Get my fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fields',
      error: error.message
    });
  }
};

const createField = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      province,
      latitude,
      longitude,
      pricePerHour,
      discountPercent,
      operatingHours,
      fieldType,
      surfaceType,
      capacity,
      status,
      amenities,
      images
    } = req.body;

    const field = await Field.create({
      name,
      description,
      address,
      city,
      province,
      latitude,
      longitude,
      ownerId: req.user.id,
      pricePerHour,
      discountPercent,
      operatingHours,
      fieldType,
      surfaceType,
      capacity,
      status,
      amenities,
      images
    });

    res.status(201).json({ success: true, data: field });
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create field',
      error: error.message
    });
  }
};

const updateField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this field'
      });
    }

    const updatableFields = [
      'name',
      'description',
      'address',
      'city',
      'province',
      'latitude',
      'longitude',
      'pricePerHour',
      'discountPercent',
      'operatingHours',
      'fieldType',
      'surfaceType',
      'capacity',
      'status',
      'amenities',
      'images'
    ];

    const updateData = {};
    for (const key of updatableFields) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const currentImages = Array.isArray(field.images) ? field.images : [];
    const nextImages =
      updateData.images !== undefined && Array.isArray(updateData.images) ? updateData.images : currentImages;

    const removedImages = currentImages.filter(
      (imgPath) => isManagedFieldImagePath(imgPath) && !nextImages.includes(imgPath)
    );

    const updatedField = await field.update(updateData);
    removedImages.forEach((imgPath) => removeFieldImageFile(imgPath));
    res.json({ success: true, data: updatedField });
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update field',
      error: error.message
    });
  }
};

const deleteField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this field'
      });
    }

    const bookingCount = await Booking.count({ where: { fieldId: field.id } });
    const deletedId = field.id;

    if (bookingCount > 0) {
      await field.update({
        isArchived: true,
        status: 'unavailable'
      });

      return res.json({
        success: true,
        message: 'Field archived successfully',
        data: { id: deletedId, archived: true }
      });
    }

    const existingImages = Array.isArray(field.images) ? field.images : [];
    await field.destroy();

    // Clean up image files after successful DB delete.
    existingImages.forEach((imgPath) => removeFieldImageFile(imgPath));

    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: { id: deletedId, archived: false }
    });
  } catch (error) {
    console.error('Delete field error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete field',
      error: error.message
    });
  }
};

const uploadFieldImages = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this field' });
    }

    const maxImageSize = serverConfig.upload.maxSize;
    const projectRoot = path.resolve(__dirname, '..', '..');
    const uploadDir = path.resolve(projectRoot, '..', 'frontend', 'public', 'uploads', 'fields');
    fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
      destination: (innerReq, file, cb) => cb(null, uploadDir),
      filename: (innerReq, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `field-${field.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      }
    });

    const upload = multer({
      storage,
      limits: { fileSize: maxImageSize, files: 5 },
      fileFilter: (innerReq, file, cb) => {
        if (!serverConfig.isAllowedImageUpload(file)) {
          return cb(new Error('Invalid file type'));
        }
        cb(null, true);
      }
    }).array('images', 5);

    upload(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: `Image too large. Max size is ${Math.floor(maxImageSize / (1024 * 1024))}MB` });
        }
        return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
      }

      if (!Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const currentImages = Array.isArray(field.images) ? field.images : [];
      const replaceExisting = String(req.body?.replaceExisting || '').toLowerCase() === 'true';
      let mergedImages;

      if (replaceExisting) {
        const remappedImages = req.files.map((file, index) => {
          const oldPath = currentImages[index];
          if (!isManagedFieldImagePath(oldPath)) {
            return `/uploads/fields/${file.filename}`;
          }

          const targetAbs = resolvePrimaryFieldImagePath(oldPath);
          if (!targetAbs) return `/uploads/fields/${file.filename}`;

          const sourceAbs = file.path;
          try {
            if (sourceAbs !== targetAbs) {
              if (fs.existsSync(targetAbs)) {
                fs.unlinkSync(targetAbs);
              }
              fs.renameSync(sourceAbs, targetAbs);
            }
            return oldPath;
          } catch {
            return `/uploads/fields/${file.filename}`;
          }
        });

        const removedOldImages = currentImages.slice(req.files.length);
        removedOldImages.forEach((oldPath) => removeFieldImageFile(oldPath));
        mergedImages = remappedImages;
      } else {
        const newImages = req.files.map((file) => `/uploads/fields/${file.filename}`);
        mergedImages = [...currentImages, ...newImages];
      }

      await field.update({ images: mergedImages });
      return res.json({
        success: true,
        data: { images: mergedImages, replaced: replaceExisting },
        message: replaceExisting ? 'Images replaced successfully' : 'Images uploaded successfully'
      });
    });
  } catch (error) {
    console.error('Upload field images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload field images',
      error: error.message
    });
  }
};

const deleteFieldImage = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this field' });
    }

    const imageIndex = Number(req.params.imageId);
    const currentImages = Array.isArray(field.images) ? field.images : [];

    if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= currentImages.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    const targetPath = currentImages[imageIndex];
    const nextImages = currentImages.filter((_, idx) => idx !== imageIndex);
    await field.update({ images: nextImages });

    removeFieldImageFile(targetPath);

    res.json({ success: true, data: { images: nextImages }, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete field image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete field image',
      error: error.message
    });
  }
};

const setFieldCoverImage = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this field' });
    }

    const imageIndex = Number(req.params.imageId);
    const currentImages = Array.isArray(field.images) ? field.images : [];

    if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= currentImages.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    if (imageIndex === 0) {
      return res.json({ success: true, data: { images: currentImages }, message: 'Cover image already set' });
    }

    const selected = currentImages[imageIndex];
    const nextImages = [selected, ...currentImages.filter((_, idx) => idx !== imageIndex)];
    await field.update({ images: nextImages });

    res.json({ success: true, data: { images: nextImages }, message: 'Cover image updated successfully' });
  } catch (error) {
    console.error('Set field cover image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set cover image',
      error: error.message
    });
  }
};

module.exports = {
  getFields,
  getField,
  getMyFields,
  createField,
  updateField,
  deleteField,
  uploadFieldImages,
  deleteFieldImage,
  setFieldCoverImage
};

