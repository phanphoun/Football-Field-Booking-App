const { Team, User, Field, TeamMember } = require('../models');

const mapPublicTeam = (teamInstance) => {
  const team = teamInstance?.toJSON ? teamInstance.toJSON() : teamInstance;
  const activeMembers =
    Array.isArray(team?.teamMembers) ? team.teamMembers.filter((m) => m.status === 'active') : [];

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
    memberCount: activeMembers.length
  };
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

    res.json({ success: true, data: teams.map(mapPublicTeam) });
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

    res.json({ success: true, data: mapPublicTeam(team) });
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
