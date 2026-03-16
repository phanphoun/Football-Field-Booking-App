const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingCancellationRequest extends Model {
    static associate(models) {
      BookingCancellationRequest.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
      BookingCancellationRequest.belongsTo(models.User, { foreignKey: 'requestedBy', as: 'requester' });
      BookingCancellationRequest.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    }
  }

  BookingCancellationRequest.init(
    {
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        }
      },
      requestedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      previousStatus: {
        type: DataTypes.STRING,
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
      },
      decisionNote: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'BookingCancellationRequest',
      tableName: 'booking_cancellation_requests',
      timestamps: true,
      paranoid: false,
      indexes: [
        { fields: ['bookingId'] },
        { fields: ['requestedBy'] },
        { fields: ['status'] }
      ]
    }
  );

  return BookingCancellationRequest;
};
