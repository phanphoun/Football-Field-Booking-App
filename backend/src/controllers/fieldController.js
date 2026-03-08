const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Field, Booking } = require('../models');
const { Op } = require('sequelize');
const serverConfig = require('../config/serverConfig');
const { sendSuccess, sendError, sendPaginated } = require('../utils/ApiResponse');
const logger = require('../utils/logger');

const removeFieldImageFile = (imagePath) => {
  if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/fields/')) return;
  const absolute = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', imagePath.slice(1));
  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
};

const getFields = async (req, res) => {
  try {
    const { page = 1, limit = 10, fieldType, surfaceType, city, minPrice, maxPrice, status = 'available' } = req.query;
    
    // Validate pagination params
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    
    const where = {};
    if (status) where.status = status;
    if (fieldType) where.fieldType = fieldType;
    if (surfaceType) where.surfaceType = surfaceType;
    if (city) where.city = city;
    
    if (minPrice || maxPrice) {
      where.pricePerHour = {};
      if (minPrice) where.pricePerHour[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.pricePerHour[Op.lte] = parseFloat(maxPrice);
    }

    const offset = (validPage - 1) * validLimit;
    
    const { count, rows } = await Field.findAndCountAll({
      where,
      limit: validLimit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    return sendPaginated(res, rows, validPage, validLimit, count, 'Fields retrieved successfully');
  } catch (error) {
    logger.error('Get fields error', { error: error.message });
    return sendError(res, 500, 'Failed to fetch fields');
  }
};

const getField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return sendError(res, 404, 'Field not found');
    }

    return sendSuccess(res, 200, field, 'Field retrieved successfully');
  } catch (error) {
    logger.error('Get field error', { error: error.message, fieldId: req.params.id });
    return sendError(res, 500, 'Failed to fetch field');
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

    const fields = await Field.findAll({ where });
    res.json({ success: true, data: fields });
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

    const updatedField = await field.update(updateData);
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
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This field cannot be deleted because it has existing bookings.'
      });
    }

    const deletedId = field.id;
    const existingImages = Array.isArray(field.images) ? field.images : [];
    await field.destroy();

    // Clean up image files after successful DB delete.
    existingImages.forEach((imgPath) => removeFieldImageFile(imgPath));

    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: { id: deletedId }
    });
  } catch (error) {
    console.error('Delete field error:', error);

    if (
      error?.name === 'SequelizeForeignKeyConstraintError' ||
      error?.original?.code === 'ER_ROW_IS_REFERENCED_2'
    ) {
      return res.status(400).json({
        success: false,
        message: 'This field cannot be deleted because it has existing bookings.'
      });
    }

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
        const allowed = serverConfig.upload.allowedTypes;
        if (!allowed.includes(file.mimetype)) {
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
      const newImages = req.files.map((file) => `/uploads/fields/${file.filename}`);
      const replaceExisting = String(req.body?.replaceExisting || '').toLowerCase() === 'true';
      const mergedImages = replaceExisting ? newImages : [...currentImages, ...newImages];

      if (replaceExisting && currentImages.length > 0) {
        currentImages.forEach((oldPath) => removeFieldImageFile(oldPath));
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

