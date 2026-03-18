const { Team, User, Field, TeamMember, Rating, MatchResult, Booking } = require('../models');
const { Op } = require('sequelize');

const mapPublicTeam = (teamInstance, ratingSummary = null) => {
  const team = teamInstance?.toJSON ? teamInstance.toJSON() : teamInstance;
  const activeMembers =
    Array.isArray(team?.teamMembers)
      ? team.teamMembers.filter((m) => m.status === 'active' && m.isActive !== false)
      : [];

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    skillLevel: team.skillLevel,
    shirtColor: team.shirtColor || team.shirt_color || null,
    jerseyColors: Array.isArray(team.jerseyColors || team.jersey_colors)
      ? team.jerseyColors || team.jersey_colors
      : team.shirtColor || team.shirt_color
      ? [team.shirtColor || team.shirt_color]
      : [],
    maxPlayers: team.maxPlayers,
    logoUrl: team.logoUrl || team.logo_url || team.logo || null,
    captainId: team.captainId,
    homeFieldId: team.homeFieldId,
    isActive: team.isActive,
    captain: team.captain
      ? {
          id: team.captain.id,
          username: team.captain.username,
          firstName: team.captain.firstName,
          lastName: team.captain.lastName
        }
      : null,
    homeField: team.homeField
      ? {
          id: team.homeField.id,
          name: team.homeField.name,
          address: team.homeField.address,
          city: team.homeField.city,
          province: team.homeField.province
        }
      : null,
    memberCount: activeMembers.length,
    rating: Number(ratingSummary?.avgRating || 0),
    totalRatings: Number(ratingSummary?.totalRatings || 0),
    latestReview: ratingSummary?.latestReview || null
  };
};

const getRatingSummaries = async (teamIds = []) => {
  if (!teamIds.length) return {};

  // use raw query for aggregation to avoid ONLY_FULL_GROUP_BY errors
  const rows = await Rating.sequelize.query(
    `SELECT teamIdRated, AVG(rating) AS avgRating, COUNT(id) AS totalRatings
     FROM ratings
     WHERE teamIdRated IN (:ids)
     GROUP BY teamIdRated`,
    {
      replacements: { ids: teamIds },
      type: Rating.sequelize.QueryTypes.SELECT
    }
  );

  const recentRows = await Rating.findAll({
    where: {
      teamIdRated: { [Op.in]: teamIds },
      review: { [Op.ne]: null }
    },
    attributes: ['teamIdRated', 'review', 'createdAt'],
    order: [['createdAt', 'DESC']],
    raw: true
  });

  const byTeam = {};
  for (const row of rows) {
    byTeam[Number(row.teamIdRated)] = {
      avgRating: Number(row.avgRating || 0),
      totalRatings: Number(row.totalRatings || 0)
    };
  }
  for (const row of recentRows) {
    const id = Number(row.teamIdRated);
    if (!byTeam[id]) byTeam[id] = { avgRating: 0, totalRatings: 0 };
    if (!byTeam[id].latestReview && row.review) {
      byTeam[id].latestReview = row.review;
    }
  }
  return byTeam;
};

const getPublicTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'name',
        'description',
        'skillLevel',
        'shirtColor',
        'jerseyColors',
        'maxPlayers',
        'logoUrl',
        'captainId',
        'homeFieldId',
        'isActive'
      ],
      include: [
        {
          model: User,
          as: 'captain',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Field,
          as: 'homeField',
          attributes: ['id', 'name', 'address', 'city', 'province'],
          required: false
        },
        {
          model: TeamMember,
          as: 'teamMembers',
          attributes: ['userId', 'status', 'isActive'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const summaries = await getRatingSummaries((teams || []).map((t) => Number(t.id)));
    res.json({
      success: true,
      data: teams.map((t) => mapPublicTeam(t, summaries[Number(t.id)]))
    });
  } catch (error) {
    console.error('Get public teams error:', error, error.stack);
    // propagate full error details for debugging
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message || 'Database operation failed',
      details: error.stack
    });
  }
};

const getPublicTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      attributes: [
        'id',
        'name',
        'description',
        'skillLevel',
        'shirtColor',
        'jerseyColors',
        'maxPlayers',
        'logoUrl',
        'captainId',
        'homeFieldId',
        'isActive'
      ],
      include: [
        {
          model: User,
          as: 'captain',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Field,
          as: 'homeField',
          attributes: ['id', 'name', 'address', 'city', 'province'],
          required: false
        },
        {
          model: TeamMember,
          as: 'teamMembers',
          attributes: ['userId', 'status', 'isActive'],
          required: false
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const summaries = await getRatingSummaries([Number(team.id)]);
    res.json({ success: true, data: mapPublicTeam(team, summaries[Number(team.id)]) });
  } catch (error) {
    console.error('Get public team by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};

const getPublicTeamMatchHistory = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);
    const team = await Team.findByPk(teamId, { attributes: ['id', 'name'] });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const completedMatches = await MatchResult.findAll({
      where: {
        matchStatus: 'completed',
        [Op.or]: [{ homeTeamId: teamId }, { awayTeamId: teamId }]
      },
      include: [
        { model: Team, as: 'homeTeam', attributes: ['id', 'name'] },
        { model: Team, as: 'awayTeam', attributes: ['id', 'name'] },
        {
          model: Booking,
          as: 'booking',
          attributes: ['startTime', 'fieldId'],
          include: [{ model: Field, as: 'field', attributes: ['id', 'name'], required: false }],
          required: false
        }
      ],
      order: [['recordedAt', 'DESC']],
      limit
    });

    const matches = completedMatches.map((match) => {
      const isHome = Number(match.homeTeamId) === teamId;
      const myScore = isHome ? Number(match.homeScore) : Number(match.awayScore);
      const opponentScore = isHome ? Number(match.awayScore) : Number(match.homeScore);
      const opponentTeam = isHome ? match.awayTeam : match.homeTeam;

      let result = 'Draw';
      if (myScore > opponentScore) result = 'Win';
      if (myScore < opponentScore) result = 'Loss';

      return {
        id: match.id,
        bookingId: match.bookingId,
        opponentTeamName: opponentTeam?.name || 'Unknown Team',
        date: match.booking?.startTime || match.recordedAt || match.createdAt,
        fieldName: match.booking?.field?.name || null,
        finalScore: `${myScore}-${opponentScore}`,
        myScore,
        opponentScore,
        result
      };
    });

    const stats = matches.reduce(
      (acc, match) => {
        if (match.result === 'Win') acc.wins += 1;
        else if (match.result === 'Loss') acc.losses += 1;
        else acc.draws += 1;
        return acc;
      },
      { total: matches.length, wins: 0, losses: 0, draws: 0 }
    );

    res.json({
      success: true,
      data: {
        teamId: team.id,
        teamName: team.name,
        stats,
        matches
      }
    });
  } catch (error) {
    console.error('Get public team match history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team match history',
      error: error.message
    });
  }
};

module.exports = {
  getPublicTeams,
  getPublicTeamById,
  getPublicTeamMatchHistory
};
