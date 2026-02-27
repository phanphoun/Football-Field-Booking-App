const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied. Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Role checking helpers
const isGuest = (req, res, next) => {
  if (!req.user || req.user.role !== 'guest') {
    return res.status(403).json({ 
      error: 'Access denied. Guest role required.' 
    });
  }
  next();
};

const isPlayer = (req, res, next) => {
  if (!req.user || req.user.role !== 'player') {
    return res.status(403).json({ 
      error: 'Access denied. Player role required.' 
    });
  }
  next();
};

const isCaptain = (req, res, next) => {
  if (!req.user || req.user.role !== 'captain') {
    return res.status(403).json({ 
      error: 'Access denied. Captain role required.' 
    });
  }
  next();
};

const isFieldOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'field_owner') {
    return res.status(403).json({ 
      error: 'Access denied. Field owner role required.' 
    });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin role required.' 
    });
  }
  next();
};

// Multiple role checkers
const isPlayerOrCaptain = (req, res, next) => {
  if (!req.user || !['player', 'captain'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Player or Captain role required.' 
    });
  }
  next();
};

const isCaptainOrFieldOwner = (req, res, next) => {
  if (!req.user || !['captain', 'field_owner'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Captain or Field owner role required.' 
    });
  }
  next();
};

const isFieldOwnerOrAdmin = (req, res, next) => {
  if (!req.user || !['field_owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Field owner or Admin role required.' 
    });
  }
  next();
};

const isCaptainOrAdmin = (req, res, next) => {
  if (!req.user || !['captain', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Captain or Admin role required.' 
    });
  }
  next();
};

// Resource ownership checker
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    // This would typically check if the user owns the resource
    // Implementation depends on the specific resource type
    // For now, we'll pass through and let controllers handle ownership
    next();
  };
};

module.exports = {
  authorize,
  isGuest,
  isPlayer,
  isCaptain,
  isFieldOwner,
  isAdmin,
  isPlayerOrCaptain,
  isCaptainOrFieldOwner,
  isFieldOwnerOrAdmin,
  isCaptainOrAdmin,
  checkOwnership
};
