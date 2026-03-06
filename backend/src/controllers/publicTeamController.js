const { Team, User, Field, TeamMember, Rating } = require('../models');
const { Op } = require('sequelize');

const mapPublicTeam = (teamInstance, ratingSummary = null) => {
  const team = teamInstance?.toJSON ? teamInstance.toJSON() : teamInstance;
  const activeMembers =
    Array.isArray(team?.teamMembers) ? team.teamMembers.filter((m) => m.status === 'accepted') : [];

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    skillLevel: team.skillLevel,
    maxPlayers: team.maxPlayers,
    logoUrl: team.logoUrl,
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

  const [rows, recentRows] = await Promise.all([
    Rating.findAll({
      where: { teamIdRated: { [Op.in]: teamIds } },
      attributes: [
        'teamIdRated',
        [Rating.sequelize.fn('AVG', Rating.sequelize.col('rating')), 'avgRating'],
        [Rating.sequelize.fn('COUNT', Rating.sequelize.col('id')), 'totalRatings']
      ],
      group: ['teamIdRated'],
      raw: true
    }),
    Rating.findAll({
      where: {
        teamIdRated: { [Op.in]: teamIds },
        review: { [Op.ne]: null }
      },
      attributes: ['teamIdRated', 'review', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true
    })
  ]);

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
        'maxPlayers',
        'logoUrl',
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
          attributes: ['userId', 'status'],
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
    console.error('Get public teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
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
        'maxPlayers',
        'logoUrl',
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
          attributes: ['userId', 'status'],
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

module.exports = {
  getPublicTeams,
  getPublicTeamById
};
