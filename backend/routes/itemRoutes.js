const express = require('express');
const router = express.Router();
const {
  streamItems,
  getItemsByList,
  addItem,
  updateItem,
  togglePurchased,
  deleteItem,
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stream/:listId', streamItems);
router.get('/list/:listId', getItemsByList);
router.post('/', addItem);
router.put('/:id', updateItem);
router.patch('/:id/purchased', togglePurchased);
router.delete('/:id', deleteItem);

module.exports = router;
