const { Model } = require('sequelize');
const { buildRealtimeHooks } = require('../realtime/modelHooks');

module.exports = (sequelize, DataTypes) => {
  class RoleRequest extends Model {
    static associate(models) {
      RoleRequest.belongsTo(models.User, { foreignKey: 'requesterId', as: 'requester' });
      RoleRequest.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    }
  }

  RoleRequest.init(
    {
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      requestedRole: {
        type: DataTypes.ENUM('captain', 'field_owner'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'RoleRequest',
      tableName: 'role_requests',
      timestamps: true,
      indexes: [
        {
          fields: ['requesterId']
        },
        {
          fields: ['requestedRole']
        },
        {
          fields: ['status']
        }
      ],
      hooks: buildRealtimeHooks('role_request')
    }
  );

  return RoleRequest;
};
