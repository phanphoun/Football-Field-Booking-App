const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { idValidation } = require('../middleware/validation');

// Protected routes
router.get('/', auth, teamMemberController.getAllTeamMembers);
router.get('/:id', auth, ...idValidation, teamMemberController.getTeamMemberById);
router.post('/', auth, checkRole(['captain', 'admin']), teamMemberController.createTeamMember);
router.put('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamMemberController.updateTeamMember);
router.delete('/:id', auth, checkRole(['captain', 'admin']), ...idValidation, teamMemberController.deleteTeamMember);

module.exports = router;
