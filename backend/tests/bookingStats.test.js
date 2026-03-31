jest.mock('../src/models', () => ({
  Booking: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  Field: {},
  User: {},
  Team: {},
  TeamMember: {},
  BookingJoinRequest: {},
  MatchResult: {},
  Notification: {},
  sequelize: {
    fn: jest.fn((name, ...args) => ({ type: 'fn', name, args })),
    col: jest.fn((name) => ({ type: 'col', name }))
  }
}));

jest.mock('sequelize', () => ({
  Op: {
    gte: Symbol.for('gte'),
    lte: Symbol.for('lte')
  },
  fn: jest.fn((name, ...args) => ({ type: 'fn', name, args })),
  col: jest.fn((name) => ({ type: 'col', name }))
}));

const { Booking, sequelize } = require('../src/models');
const { Op, fn, col } = require('sequelize');
const { getBookingStats } = require('../src/controllers/bookingController');

describe('getBookingStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns aggregated booking statistics instead of failing at runtime', async () => {
    Booking.count.mockResolvedValue(12);
    Booking.findAll
      .mockResolvedValueOnce([
        { status: 'confirmed', count: '7' },
        { status: 'cancelled', count: '5' }
      ])
      .mockResolvedValueOnce([{ totalRevenue: '240.50' }])
      .mockResolvedValueOnce([{ avgDurationHours: '2.5' }])
      .mockResolvedValueOnce([
        { month: '2026-02', bookings: '4', revenue: '100.25' },
        { month: '2026-03', bookings: '8', revenue: '140.25' }
      ]);

    const req = {
      query: {
        fieldId: '4',
        teamId: '9',
        startDate: '2026-01-01',
        endDate: '2026-03-31'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await getBookingStats(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        summary: {
          totalBookings: 12,
          totalRevenue: 240.5,
          avgDurationHours: 2.5
        },
        byStatus: [
          { status: 'confirmed', count: 7 },
          { status: 'cancelled', count: 5 }
        ],
        monthlyTrends: [
          { month: '2026-02', bookings: 4, revenue: 100.25 },
          { month: '2026-03', bookings: 8, revenue: 140.25 }
        ]
      }
    });

    expect(Booking.count).toHaveBeenCalledWith({
      where: {
        fieldId: '4',
        teamId: '9',
        createdAt: {
          [Op.gte]: new Date('2026-01-01'),
          [Op.lte]: new Date('2026-03-31')
        }
      }
    });

    expect(fn).toHaveBeenCalledWith('COUNT', col('id'));
    expect(fn).toHaveBeenCalledWith('SUM', col('totalPrice'));
    expect(sequelize.fn).toHaveBeenCalled();
    expect(sequelize.col).toHaveBeenCalled();
  });
});
