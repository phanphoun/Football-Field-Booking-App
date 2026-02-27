const { Rating, Team, Booking } = require('../models');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getAllRatings = asyncHandler(async (req, res) => {
  const { teamIdRated, teamIdRater, bookingId, ratingType } = req.query;
  const whereClause = {};
  
  if (teamIdRated) whereClause.teamIdRated = teamIdRated;
  if (teamIdRater) whereClause.teamIdRater = teamIdRater;
  if (bookingId) whereClause.bookingId = bookingId;
  if (ratingType) whereClause.ratingType = ratingType;

  const ratings = await Rating.findAll({
    where: whereClause,
    include: [
      { model: Team, as: 'raterTeam' },
      { model: Team, as: 'ratedTeam' },
      { model: Booking, as: 'booking' }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: ratings });
});

const getRatingById = asyncHandler(async (req, res) => {
  const rating = await Rating.findByPk(req.params.id, {
    include: [
      { model: Team, as: 'raterTeam' },
      { model: Team, as: 'ratedTeam' },
      { model: Booking, as: 'booking' }
    ]
  });
  
  if (!rating) {
    return res.status(404).json({ success: false, message: 'Rating not found' });
  }
  
  res.json({ success: true, data: rating });
});

const createRating = asyncHandler(async (req, res) => {
  const rating = await Rating.create(req.body);
  res.status(201).json({ success: true, data: rating });
});

module.exports = {
  getAllRatings,
  getRatingById,
  createRating
};
