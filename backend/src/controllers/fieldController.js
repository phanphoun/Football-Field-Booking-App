const { Field } = require('../models');



const getFields = async (req, res) => {

  try {

    const fields = await Field.findAll();

    res.json(fields);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



const getField = async (req, res) => {

  try {

    const field = await Field.findByPk(req.params.id);

    if (!field) {

      return res.status(404).json({ error: 'Field not found' });

    }

    res.json(field);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



const createField = async (req, res) => {

  try {

    const { name, location, price, description, images } = req.body;

    const field = await Field.create({

      name,

      location,

      price,

      description,

      images,

      ownerId: req.user.id

    });

    res.status(201).json(field);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



const updateField = async (req, res) => {

  try {

    const { name, location, price, description, images } = req.body;

    const field = await Field.findByPk(req.params.id);

    if (!field) {

      return res.status(404).json({ error: 'Field not found' });

    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {

      return res.status(403).json({ error: 'Not authorized to update this field' });

    }

    

    await field.update({ name, location, price, description, images });

    res.json(field);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



const deleteField = async (req, res) => {

  try {

    const field = await Field.findByPk(req.params.id);

    if (!field) {

      return res.status(404).json({ error: 'Field not found' });

    }

    if (field.ownerId !== req.user.id && req.user.role !== 'admin') {

      return res.status(403).json({ error: 'Not authorized to delete this field' });

    }

    

    await field.destroy();

    res.json({ message: 'Field deleted successfully' });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



module.exports = {

  getFields,

  getField,

  createField,

  updateField,

  deleteField

};