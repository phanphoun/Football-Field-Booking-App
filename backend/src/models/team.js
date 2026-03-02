const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
      Team.belongsTo(models.User, {
        foreignKey: 'captainId',
        as: 'captain'
      });

      Team.belongsTo(models.Field, {
        foreignKey: 'homeFieldId',
        as: 'homeField'
      });

      Team.hasMany(models.TeamMember, {
        foreignKey: 'teamId',
        as: 'teamMembers'
      });

      Team.hasMany(models.Booking, {
        foreignKey: 'teamId',
        as: 'bookings'
      });

      Team.hasMany(models.MatchResult, {
        foreignKey: 'homeTeamId',
        as: 'homeMatches'
      });

      Team.hasMany(models.MatchResult, {
        foreignKey: 'awayTeamId',
        as: 'awayMatches'
      });
    }
  }

  Team.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100]
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
      maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 11,
        validate: {
          min: 1,
          max: 50
        }
      },
      skillLevel: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'professional'),
        allowNull: false,
        defaultValue: 'intermediate'
      },
      homeFieldId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'fields',
          key: 'id'
        }
      },
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Team',
      tableName: 'teams',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['captain_id'] },
        { fields: ['home_field_id'] },
        { fields: ['skill_level'] },
        { fields: ['is_active'] }
      ]
    }
  );

  return Team;
};
