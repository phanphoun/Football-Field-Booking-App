const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {
      // Field belongs to an owner (user)
      Field.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
      // Field has many bookings
      Field.hasMany(models.Booking, { foreignKey: 'fieldId', as: 'bookings' });
      // Field can have ratings
      Field.hasMany(models.Rating, { foreignKey: 'fieldId', as: 'ratings' });
    }
  }

  Field.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255],
        notEmpty: true
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pricePerHour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    operatingHours: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '08:00', close: '22:00' },
        sunday: { open: '08:00', close: '22:00' }
      }
    },
    fieldType: {
      type: DataTypes.ENUM('5v5', '7v7', '11v11', 'futsal'),
      allowNull: false,
      defaultValue: '11v11'
    },
    surfaceType: {
      type: DataTypes.ENUM('natural_grass', 'artificial_turf', 'concrete', 'indoor'),
      allowNull: false,
      defaultValue: 'artificial_turf'
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 50
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'unavailable', 'maintenance'),
      defaultValue: 'available',
      allowNull: false
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Field',
    tableName: 'fields',
    timestamps: true,
    paranoid: false
  });
  return Field;
};