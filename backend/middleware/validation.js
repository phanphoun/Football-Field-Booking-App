const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('first_name')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('last_name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('phone')
        .optional()
        .isLength({ min: 9, max: 15 })
        .withMessage('Phone number must be between 9 and 15 characters')
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('Phone number can only contain numbers, +, -, spaces, and parentheses'),
    
    body('role')
        .optional()
        .isIn(['player', 'field_owner', 'team_captain', 'admin'])
        .withMessage('Role must be one of: player, field_owner, team_captain, admin'),
    
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username or email is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Field ID validation
const validateFieldId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Field ID must be a positive integer'),
    
    handleValidationErrors
];

// User ID validation
const validateUserId = [
    param('userId')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    
    handleValidationErrors
];

// Booking creation validation
const validateBookingCreation = [
    body('field_id')
        .isInt({ min: 1 })
        .withMessage('Field ID must be a positive integer'),
    
    body('team_id')
        .isInt({ min: 1 })
        .withMessage('Team ID must be a positive integer'),
    
    body('start_time')
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 date')
        .custom((value) => {
            const startTime = new Date(value);
            const now = new Date();
            if (startTime <= now) {
                throw new Error('Start time must be in the future');
            }
            return true;
        }),
    
    body('end_time')
        .isISO8601()
        .withMessage('End time must be a valid ISO 8601 date')
        .custom((value, { req }) => {
            const endTime = new Date(value);
            const startTime = new Date(req.body.start_time);
            if (endTime <= startTime) {
                throw new Error('End time must be after start time');
            }
            return true;
        }),
    
    body('special_requests')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Special requests must be less than 500 characters'),
    
    handleValidationErrors
];

// Team creation validation
const validateTeamCreation = [
    body('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Team name must be between 3 and 100 characters')
        .matches(/^[a-zA-Z0-9\s]+$/)
        .withMessage('Team name can only contain letters, numbers, and spaces'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    
    body('skill_level')
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Skill level must be one of: beginner, intermediate, advanced'),
    
    body('home_location')
        .isIn(['phnom_penh', 'siem_reap', 'battambang', 'other'])
        .withMessage('Home location must be one of: phnom_penh, siem_reap, battambang, other'),
    
    body('max_players')
        .isInt({ min: 5, max: 30 })
        .withMessage('Max players must be between 5 and 30'),
    
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateFieldId,
    validateUserId,
    validateBookingCreation,
    validateTeamCreation,
    handleValidationErrors
};
