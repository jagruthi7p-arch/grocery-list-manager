const express = require('express');
const router = express.Router();
const {
  createList,
  getListsByGroup,
  getListById,
  updateList,
  deleteList,
} = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(createList);
router.route('/group/:groupId').get(getListsByGroup);
router.route('/:id').get(getListById).put(updateList).delete(deleteList);

module.exports = router;
