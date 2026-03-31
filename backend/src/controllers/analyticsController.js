const { Booking, Field, MatchResult, Team, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Wrapper to handle async errors gracefully
 * Prevents unhandled promise rejections
 */
// Support async handler for this module.
const asyncHandler = (fnHandler) => (req, res, next) => {
  Promise.resolve(fnHandler(req, res, next)).catch(next);
};

/**
 * Parse date range from query parameters
 * Returns formatted from and to dates with time boundaries
 */
// Parse date range into a usable value.
const parseDateRange = (query) => {
  // Default to last 30 days if no dates provided
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Set time boundaries for full day coverage
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  
  return { from, to };
};

/**
 * Determine data access scope based on user role
 * Admins see all data, field owners see their fields, users see their own bookings
 */
// Resolve scope into a display-safe value.
const resolveScope = async (req) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  // Admin can see all data
  if (userRole === 'admin') {
    return { where: {} };
  }

  // Field owner can only see their fields' data
  if (userRole === 'field_owner') {
    const ownedFields = await Field.findAll({
      where: { ownerId: userId },
      attributes: ['id'],
      raw: true
    });
    
    const fieldIds = ownedFields.map((row) => row.id);
    return { where: { fieldId: fieldIds.length > 0 ? { [Op.in]: fieldIds } : -1 } };
  }

  // Regular users can only see their own data
  return { where: { createdBy: userId } };
};

/**
 * Normalize booking status counts with default values
 * Ensures all statuses are present even with zero counts
 */
// Normalize status counts into a consistent shape.
const normalizeStatusCounts = (rows) => {
  const defaultStatuses = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
  
  return rows.reduce((acc, row) => {
    acc[row.status] = Number(row.count || 0);
    return acc;
  }, defaultStatuses);
};

/**
 * Calculate booking completion rate percentage
 */
// Calculate completion rate from the current data.
const calculateCompletionRate = (statusCounts) => {
  const totalBookings = Object.values(statusCounts).reduce((sum, count) => sum + Number(count || 0), 0);
  
  if (totalBookings === 0) return 0;
  
  const completedBookings = statusCounts.completed || 0;
  return Number(((completedBookings / totalBookings) * 100).toFixed(2));
};

const formatMonthKey = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short'
  });

const toDisplayName = (user) => {
  if (!user) return 'Unknown Player';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.username || user.email || 'Unknown Player';
};

// ========================================
// MAIN CONTROLLER FUNCTIONS
// ========================================

/**
 * GET /api/analytics/overview
 * Get comprehensive analytics overview
 * Returns booking statistics, revenue trends, and field performance
 */
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  try {
    // Parse date range from query parameters
    const { from, to } = parseDateRange(req.query);
    
    // Determine data access scope based on user role
    const { where } = await resolveScope(req);
    const dateWhere = { ...where, startTime: { [Op.between]: [from, to] } };

    // Fetch analytics data in parallel for better performance
    const [
      statusRows,        // Bookings grouped by status
      dailyRows,         // Daily booking trends
      revenueRows,       // Daily revenue trends
      peakHourRows,     // Peak booking hours
      fieldRows,        // Field performance metrics
      matchRows         // Completed match results
    ] = await Promise.all([
      // Bookings grouped by status
      Booking.findAll({
        where: dateWhere,
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true
      }),
      
      // Daily booking trends
      Booking.findAll({
        where: dateWhere,
        attributes: [[fn('DATE', col('startTime')), 'date'], [fn('COUNT', col('id')), 'count']],
        group: [literal('date')],
        order: [[literal('date'), 'ASC']],
        raw: true
      }),
      
      // Daily revenue trends (only confirmed/completed bookings)
      Booking.findAll({
        where: {
          ...dateWhere,
          status: { [Op.in]: ['confirmed', 'completed'] }
        },
        attributes: [[fn('DATE', col('startTime')), 'date'], [fn('SUM', col('totalPrice')), 'revenue']],
        group: [literal('date')],
        order: [[literal('date'), 'ASC']],
        raw: true
      }),
      
      // Peak booking hours (top 5 busiest hours)
      Booking.findAll({
        where: dateWhere,
        attributes: [[fn('HOUR', col('startTime')), 'hour'], [fn('COUNT', col('id')), 'count']],
        group: [literal('hour')],
        order: [[literal('count'), 'DESC']],
        limit: 5,
        raw: true
      }),
      
      // Field performance metrics (top 10 performing fields)
      Booking.findAll({
        where: dateWhere,
        attributes: [
          'fieldId',
          [fn('COUNT', col('Booking.id')), 'bookingCount'],
          [fn('SUM', col('totalPrice')), 'revenue']
        ],
        include: [
          { 
            model: Field, 
            as: 'field', 
            attributes: ['id', 'name', 'city', 'province'], 
            required: true 
          }
        ],
        group: ['fieldId', 'field.id', 'field.name', 'field.city', 'field.province'],
        order: [[literal('bookingCount'), 'DESC']],
        limit: 10
      }),

      MatchResult.findAll({
        where: { matchStatus: 'completed' },
        include: [
          {
            model: Booking,
            as: 'booking',
            attributes: ['id', 'startTime', 'fieldId'],
            where: dateWhere,
            required: true,
            include: [
              {
                model: Field,
                as: 'field',
                attributes: ['id', 'name', 'city', 'province'],
                required: false
              }
            ]
          },
          {
            model: Team,
            as: 'homeTeam',
            attributes: ['id', 'name', 'logoUrl'],
            required: false
          },
          {
            model: Team,
            as: 'awayTeam',
            attributes: ['id', 'name', 'logoUrl'],
            required: false
          },
          {
            model: User,
            as: 'mvpPlayer',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            required: false
          }
        ],
        order: [[{ model: Booking, as: 'booking' }, 'startTime', 'ASC']]
      })
    ]);

    // Process and calculate summary statistics
    const bookingsByStatus = normalizeStatusCounts(statusRows);
    const totalBookings = Object.values(bookingsByStatus).reduce((sum, count) => sum + Number(count || 0), 0);
    const totalRevenue = revenueRows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const completionRate = calculateCompletionRate(bookingsByStatus);
    const safeMatchRows = matchRows.map((row) => (row.toJSON ? row.toJSON() : row));

    const teamMap = new Map();
    const monthlyTrendMap = new Map();
    const scorerMap = new Map();

    for (const match of safeMatchRows) {
      const bookingDate = match.booking?.startTime || match.recordedAt || match.createdAt;
      const monthKey = formatMonthKey(bookingDate);

      if (monthKey) {
        const current = monthlyTrendMap.get(monthKey) || {
          monthKey,
          monthLabel: formatMonthLabel(bookingDate),
          matches: 0,
          goals: 0
        };
        current.matches += 1;
        current.goals += Number(match.homeScore || 0) + Number(match.awayScore || 0);
        monthlyTrendMap.set(monthKey, current);
      }

      const upsertTeam = (team, goalsFor, goalsAgainst) => {
        if (!team?.id) return;
        const existing = teamMap.get(team.id) || {
          teamId: team.id,
          teamName: team.name || 'Unknown Team',
          teamLogoUrl: team.logoUrl || null,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          played: 0,
          points: 0
        };

        existing.played += 1;
        existing.goalsFor += goalsFor;
        existing.goalsAgainst += goalsAgainst;

        if (goalsFor > goalsAgainst) {
          existing.wins += 1;
          existing.points += 3;
        } else if (goalsFor < goalsAgainst) {
          existing.losses += 1;
        } else {
          existing.draws += 1;
          existing.points += 1;
        }

        teamMap.set(team.id, existing);
      };

      upsertTeam(match.homeTeam, Number(match.homeScore || 0), Number(match.awayScore || 0));
      upsertTeam(match.awayTeam, Number(match.awayScore || 0), Number(match.homeScore || 0));

      if (match.mvpPlayer?.id) {
        const existingPlayer = scorerMap.get(match.mvpPlayer.id) || {
          playerId: match.mvpPlayer.id,
          name: toDisplayName(match.mvpPlayer),
          username: match.mvpPlayer.username || null,
          teamName: null,
          goals: 0,
          metricLabel: 'MVP Awards'
        };

        existingPlayer.goals += 1;
        if (!existingPlayer.teamName) {
          if (Number(match.homeTeam?.captainId) === Number(match.mvpPlayer.id)) {
            existingPlayer.teamName = match.homeTeam?.name || null;
          } else if (Number(match.awayTeam?.captainId) === Number(match.mvpPlayer.id)) {
            existingPlayer.teamName = match.awayTeam?.name || null;
          } else {
            existingPlayer.teamName = match.homeTeam?.name || match.awayTeam?.name || null;
          }
        }
        scorerMap.set(match.mvpPlayer.id, existingPlayer);
      }
    }

    const monthlyMatchTrends = Array.from(monthlyTrendMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const teamPerformance = Array.from(teamMap.values())
      .map((team) => ({
        ...team,
        goalDifference: team.goalsFor - team.goalsAgainst
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .slice(0, 5);

    const topScorers = Array.from(scorerMap.values())
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);

    const totalMatches = safeMatchRows.length;
    const totalGoals = safeMatchRows.reduce(
      (sum, match) => sum + Number(match.homeScore || 0) + Number(match.awayScore || 0),
      0
    );
    const activeTeams = teamMap.size;
    const averageGoalsPerMatch = totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0;
    const utilizationRate = totalBookings > 0
      ? Number((((bookingsByStatus.confirmed || 0) + (bookingsByStatus.completed || 0)) / totalBookings * 100).toFixed(1))
      : 0;

    const midpoint = Math.ceil(bookingsTrendLengthOrOne(dailyRows) / 2);
    const firstHalfCount = dailyRows
      .slice(0, midpoint)
      .reduce((sum, row) => sum + Number(row.count || 0), 0);
    const secondHalfCount = dailyRows
      .slice(midpoint)
      .reduce((sum, row) => sum + Number(row.count || 0), 0);
    const bookingGrowthRate = firstHalfCount > 0
      ? Number((((secondHalfCount - firstHalfCount) / firstHalfCount) * 100).toFixed(1))
      : secondHalfCount > 0
        ? 100
        : 0;

    // Format response data for frontend consumption
    const responseData = {
      scope: req.user.role,
      from: from.toISOString(),
      to: to.toISOString(),
      summary: {
        totalBookings,
        totalRevenue,
        completionRate,
        totalMatches,
        totalGoals,
        averageGoalsPerMatch,
        activeTeams,
        utilizationRate,
        bookingGrowthRate
      },
      bookingsByStatus,
      bookingsTrend: dailyRows.map((row) => ({ 
        date: row.date, 
        count: Number(row.count || 0) 
      })),
      revenueTrend: revenueRows.map((row) => ({ 
        date: row.date, 
        revenue: Number(row.revenue || 0) 
      })),
      peakHours: peakHourRows.map((row) => ({ 
        hour: Number(row.hour), 
        count: Number(row.count || 0) 
      })),
      monthlyMatchTrends,
      teamPerformance,
      topScorers,
      fieldPerformance: fieldRows.map((row) => {
        const fieldData = row.toJSON ? row.toJSON() : row;
        return {
          fieldId: fieldData.fieldId,
          bookingCount: Number(fieldData.bookingCount || 0),
          revenue: Number(fieldData.revenue || 0),
          field: fieldData.field
        };
      })
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics overview',
      error: error.message
    });
  }
});

function bookingsTrendLengthOrOne(rows) {
  return Math.max(Array.isArray(rows) ? rows.length : 0, 1);
}

/**
 * GET /api/analytics/csv
 * Export analytics data as CSV file
 * Downloads booking data for the specified date range
 */
const getAnalyticsCsv = asyncHandler(async (req, res) => {
  try {
    // Parse date range from query parameters
    const { from, to } = parseDateRange(req.query);
    const { where } = await resolveScope(req);

    // Fetch booking data for CSV export
    const bookings = await Booking.findAll({
      where: { ...where, startTime: { [Op.between]: [from, to] } },
      include: [
        { 
          model: Field, 
          as: 'field', 
          attributes: ['name'], 
          required: false 
        }
      ],
      order: [['startTime', 'ASC']]
    });

    // Generate CSV content
    const csvHeader = 'bookingId,field,status,startTime,endTime,totalPrice\n';
    const csvBody = bookings
      .map((booking) => {
        // Escape field names with quotes to handle commas
        const field = booking.field?.name || '';
        const escapedField = `"${field.replace(/"/g, '""')}"`;
        
        return [
          booking.id,
          escapedField,
          booking.status,
          booking.startTime?.toISOString?.() || '',
          booking.endTime?.toISOString?.() || '',
          Number(booking.totalPrice || 0)
        ].join(',');
      })
      .join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.csv"`);
    
    res.status(200).send(`${csvHeader}${csvBody}`);

  } catch (error) {
    console.error('Analytics CSV export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

module.exports = {
  getAnalyticsOverview,
  getAnalyticsCsv
};
