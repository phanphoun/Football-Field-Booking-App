const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const auth = require('../middleware/auth');

router.get('/', auth, teamMemberController.getAllTeamMembers);
router.post('/', auth, teamMemberController.createTeamMember);

module.exports = router;
