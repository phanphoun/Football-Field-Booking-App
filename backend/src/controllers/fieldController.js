const { Field } = require('../models');

const getFields = async (req, res) => {
  try {
    const fields = await Field.findAll();
    res.json({ success: true, data: fields });
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
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    res.json({ success: true, data: field });
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

    const deletedId = field.id;
    await field.destroy();

    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: { id: deletedId }
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

module.exports = {
  getFields,
  getField,
  getMyFields,
  createField,
  updateField,
  deleteField
};

