const { Model } = require('sequelize');



module.exports = (sequelize, DataTypes) => {

  class Team extends Model {

    static associate(models) {

      // Team belongs to a captain (user)

      Team.belongsTo(models.User, { foreignKey: 'captainId', as: 'captain' });

      // Team has many bookings

      Team.hasMany(models.Booking, { foreignKey: 'teamId', as: 'bookings' });

      Team.hasMany(models.Booking, { foreignKey: 'opponentTeamId', as: 'opponentBookings' });

      // Team has many match results

      Team.hasMany(models.MatchResult, { foreignKey: 'homeTeamId', as: 'homeMatches' });

      Team.hasMany(models.MatchResult, { foreignKey: 'awayTeamId', as: 'awayMatches' });

      // Team can give and receive ratings

      Team.hasMany(models.Rating, { foreignKey: 'teamIdRater', as: 'givenRatings' });

      Team.hasMany(models.Rating, { foreignKey: 'teamIdRated', as: 'receivedRatings' });

      // Team has many members

      Team.hasMany(models.TeamMember, { foreignKey: 'teamId', as: 'members' });

      // Team belongs to many users (through TeamMember)

      Team.belongsToMany(models.User, { 

        through: models.TeamMember, 

        foreignKey: 'teamId',

        otherKey: 'userId',

        as: 'players'

      });

    }
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/models/team.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/models/team.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/models/team.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/models/team.js
<<<<<<< C:/Users/PHOUN.PHAN/Desktop/Football-Field-Booking-App/backend/src/models/team.js

  }



=======

  }
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/backend/src/models/team.js
=======

  }
  
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/backend/src/models/team.js
=======

  }
  
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/backend/src/models/team.js
=======

  }
  
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/backend/src/models/team.js
=======

  }
  
>>>>>>> C:/Users/PHOUN.PHAN/.windsurf/worktrees/Football-Field-Booking-App/Football-Field-Booking-App-7bd4a5b2/backend/src/models/team.js
  Team.init({

    name: {

      type: DataTypes.STRING,

      allowNull: false,

      validate: {

        len: [1, 100],

        notEmpty: true

      }

    },

    logoUrl: {

      type: DataTypes.STRING,

      allowNull: true

    },

    jerseyColor: {

      type: DataTypes.STRING,

      allowNull: true,

      validate: {

        is: /^#[0-9A-F]{6}$/i // Hex color validation

      }

    },

    secondaryColor: {

      type: DataTypes.STRING,

      allowNull: true,

      validate: {

        is: /^#[0-9A-F]{6}$/i // Hex color validation

      }

    },

    description: {

      type: DataTypes.TEXT,

      allowNull: true

    },

    captainId: {

      type: DataTypes.INTEGER,

      allowNull: false,

      references: {

        model: 'users',

        key: 'id'

      }

    },

    status: {

      type: DataTypes.ENUM('active', 'inactive', 'suspended'),

      defaultValue: 'active',

      allowNull: false

    },

    maxPlayers: {

      type: DataTypes.INTEGER,

      allowNull: false,

      defaultValue: 11,

      validate: {

        min: 5,

        max: 30

      }

    },

    currentPlayers: {

      type: DataTypes.INTEGER,

      allowNull: false,

      defaultValue: 1,

      validate: {

        min: 1

      }

    },

    homeFieldLocation: {

      type: DataTypes.STRING,

      allowNull: true

    },

    skillLevel: {

      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'professional'),

      allowNull: true

    },

    preferredTime: {

      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'flexible'),

      allowNull: true

    }

  }, {

    sequelize,

    modelName: 'Team',

    tableName: 'teams',

    timestamps: true,

    paranoid: false

  });

  return Team;

};