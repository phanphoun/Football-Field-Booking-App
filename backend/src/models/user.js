const { Model } = require('sequelize');



module.exports = (sequelize, DataTypes) => {

  class User extends Model {

    static associate(models) {

      // User can own fields

      User.hasMany(models.Field, { foreignKey: 'ownerId', as: 'fields' });

      // User can make bookings as creator

      User.hasMany(models.Booking, { foreignKey: 'createdBy', as: 'createdBookings' });

      // User can be captain of a team

      User.hasMany(models.Team, { foreignKey: 'captain_id', as: 'captainedTeams' });

      // User can belong to teams

      User.belongsToMany(models.Team, { 

        through: models.TeamMember, 

        foreignKey: 'userId',

        otherKey: 'teamId',

        as: 'teams'

      });

      // User can receive notifications

      User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });

      // User can record match results

      User.hasMany(models.MatchResult, { foreignKey: 'recordedBy', as: 'recordedMatches' });

      // User can be MVP in matches

      User.hasMany(models.MatchResult, { foreignKey: 'mvpPlayerId', as: 'mvpMatches' });

    }

  }



  User.init({

    username: {

      type: DataTypes.STRING,

      allowNull: false,

      unique: true,

      validate: {

        len: [3, 30],

        notEmpty: true

      }

    },

    email: {

      type: DataTypes.STRING,

      allowNull: false,

      unique: true,

      validate: {

        isEmail: true,

        notEmpty: true

      }

    },

    password: {

      type: DataTypes.STRING,

      allowNull: false,

      validate: {

        len: [6, 255],

        notEmpty: true

      }

    },

    firstName: {

      type: DataTypes.STRING,

      allowNull: false,

      validate: {

        len: [1, 50],

        notEmpty: true

      }

    },

    lastName: {

      type: DataTypes.STRING,

      allowNull: false,

      validate: {

        len: [1, 50],

        notEmpty: true

      }

    },

    phone: {

      type: DataTypes.STRING,

      allowNull: true,

      validate: {

        is: /^[0-9+\-\s()]+$/

      }

    },

    role: {

      type: DataTypes.ENUM('guest', 'player', 'captain', 'field_owner', 'admin'),

      defaultValue: 'player',

      allowNull: false

    },

    status: {

      type: DataTypes.ENUM('active', 'inactive', 'suspended'),

      defaultValue: 'active',

      allowNull: false

    },

    avatarUrl: {

      type: DataTypes.STRING,

      allowNull: true

    },

    dateOfBirth: {

      type: DataTypes.DATEONLY,

      allowNull: true,

      validate: {

        isDate: true,

        isBefore: new Date().toISOString().split('T')[0]

      }

    },

    gender: {

      type: DataTypes.ENUM('male', 'female', 'other'),

      allowNull: true

    },

    address: {

      type: DataTypes.TEXT,

      allowNull: true

    },

    emailVerified: {

      type: DataTypes.BOOLEAN,

      defaultValue: false,

      allowNull: false

    },

    lastLogin: {

      type: DataTypes.DATE,

      allowNull: true

    }

  }, {

    sequelize,

    modelName: 'User',

    tableName: 'users',

    timestamps: true,

    paranoid: false 

  });

  return User;

};