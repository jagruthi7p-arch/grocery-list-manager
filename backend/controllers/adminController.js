const User = require('../models/User');
const Group = require('../models/Group');
const List = require('../models/List');
const Item = require('../models/Item');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [users, groups, lists, items] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      List.countDocuments(),
      Item.countDocuments(),
    ]);
    res.json({ users, groups, lists, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, deleteUser, getStats };
