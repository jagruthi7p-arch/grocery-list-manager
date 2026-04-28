const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
  deleteGroup,
  renameGroup,
  generateInvite,
  joinByInvite,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getMyGroups).post(createGroup);
router.post('/join/:inviteCode', joinByInvite);
router.route('/:id').get(getGroupById).put(renameGroup).delete(deleteGroup);
router.route('/:id/members').post(addMember);
router.route('/:id/members/:userId').delete(removeMember);
router.post('/:id/invite', generateInvite);

module.exports = router;
