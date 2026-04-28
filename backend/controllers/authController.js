const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const List = require('../models/List');
const Item = require('../models/Item');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const role =
      adminSecret && adminSecret === process.env.ADMIN_SECRET ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, currentPassword, newPassword } = req.body;

    if (name) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const match = await user.matchPassword(currentPassword);
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();

    const updated = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    };

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/auth/account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Remove user from all groups they are a member of (but not owner)
    await Group.updateMany({ members: user._id }, { $pull: { members: user._id } });

    // Delete groups owned by this user (and their lists/items)
    const ownedGroups = await Group.find({ createdBy: user._id }).select('_id');
    const ownedGroupIds = ownedGroups.map((g) => g._id);

    const ownedLists = await List.find({ groupId: { $in: ownedGroupIds } }).select('_id');
    const ownedListIds = ownedLists.map((l) => l._id);

    await Item.deleteMany({ listId: { $in: ownedListIds } });
    await List.deleteMany({ groupId: { $in: ownedGroupIds } });
    await Group.deleteMany({ createdBy: user._id });

    // Delete lists/items the user created in groups they were a member of
    const userLists = await List.find({ createdBy: user._id }).select('_id');
    const userListIds = userLists.map((l) => l._id);
    await Item.deleteMany({ listId: { $in: userListIds } });
    await List.deleteMany({ createdBy: user._id });
    await Item.deleteMany({ addedBy: user._id });

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, updateProfile, deleteAccount };
