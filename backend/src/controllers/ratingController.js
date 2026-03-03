const { Rating, Team, Booking, User } = require('../models');

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
  try {
    const rating = await Rating.create(req.body);
    res.status(201).json({ success: true, data: rating });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const updateRating = asyncHandler(async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    // Authorization check - only admin can update for now
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this rating' });
    }
    
    const updatedRating = await rating.update(req.body);
    res.json({ success: true, data: updatedRating });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const deleteRating = asyncHandler(async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);
    
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    // Authorization check - only admin can delete for now
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this rating' });
    }
    
    await rating.destroy();
    res.json({ success: true, message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating
};
