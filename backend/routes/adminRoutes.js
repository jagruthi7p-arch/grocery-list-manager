const express = require('express');
const router = express.Router();
const {
  getAllUsers, deleteUser, updateUserRole,
  getAllGroups, deleteGroup,
  getAllLists, deleteList,
  getStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.get('/groups', getAllGroups);
router.delete('/groups/:id', deleteGroup);
router.get('/lists', getAllLists);
router.delete('/lists/:id', deleteList);

module.exports = router;
