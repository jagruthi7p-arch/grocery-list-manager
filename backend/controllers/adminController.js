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
    // Clean up user data
    const ownedGroups = await Group.find({ createdBy: user._id }).select('_id');
    const ownedGroupIds = ownedGroups.map((g) => g._id);
    const ownedLists = await List.find({ groupId: { $in: ownedGroupIds } }).select('_id');
    const ownedListIds = ownedLists.map((l) => l._id);
    await Item.deleteMany({ listId: { $in: ownedListIds } });
    await List.deleteMany({ groupId: { $in: ownedGroupIds } });
    await Group.deleteMany({ createdBy: user._id });
    await Group.updateMany({ members: user._id }, { $pull: { members: user._id } });
    const userLists = await List.find({ createdBy: user._id }).select('_id');
    const userListIds = userLists.map((l) => l._id);
    await Item.deleteMany({ listId: { $in: userListIds } });
    await List.deleteMany({ createdBy: user._id });
    await Item.deleteMany({ addedBy: user._id });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }
    user.role = role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/groups
const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const lists = await List.find({ groupId: group._id }).select('_id');
    const listIds = lists.map((l) => l._id);
    await Item.deleteMany({ listId: { $in: listIds } });
    await List.deleteMany({ groupId: group._id });
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/lists
const getAllLists = async (req, res) => {
  try {
    const lists = await List.find()
      .populate('createdBy', 'name email')
      .populate('groupId', 'groupName')
      .sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/lists/:id
const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    await Item.deleteMany({ listId: list._id });
    await list.deleteOne();
    res.json({ message: 'List deleted' });
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

module.exports = { getAllUsers, deleteUser, updateUserRole, getAllGroups, deleteGroup, getAllLists, deleteList, getStats };

