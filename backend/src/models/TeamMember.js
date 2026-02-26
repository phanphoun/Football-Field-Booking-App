const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TeamMember extends Model {
    static associate(models) {
      // TeamMember belongs to a team
      TeamMember.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
      // TeamMember belongs to a user
      TeamMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  TeamMember.init({
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('captain', 'player', 'substitute'),
      allowNull: false,
      defaultValue: 'player'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending',
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TeamMember',
    tableName: 'team_members',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['teamId', 'userId']
      }
    ]
  });
  return TeamMember;
};
