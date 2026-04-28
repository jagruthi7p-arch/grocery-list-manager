const Group = require('../models/Group');

// POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) return res.status(400).json({ message: 'Group name is required' });

    const group = await Group.create({
      groupName,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/groups
const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/groups/:id
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/groups/:id/members
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can add members' });
    }
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push(userId);
    await group.save();
    await group.populate('members', 'name email');
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/groups/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can remove members' });
    }

    group.members = group.members.filter((m) => m.toString() !== req.params.userId);
    await group.save();
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/groups/:id
const renameGroup = async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) return res.status(400).json({ message: 'Group name is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can rename the group' });
    }

    group.groupName = groupName.trim();
    await group.save();
    res.json({ groupName: group.groupName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can delete the group' });
    }

    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/groups/:id/invite  — regenerate invite code (owner only)
const generateInvite = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can manage invites' });
    }

    const crypto = require('crypto');
    group.inviteCode = crypto.randomBytes(16).toString('hex');
    await group.save();
    res.json({ inviteCode: group.inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/groups/join/:inviteCode  — join a group via invite link
const joinByInvite = async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode })
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) return res.status(404).json({ message: 'Invalid or expired invite link' });

    const alreadyMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.json({ message: 'Already a member', group });
    }

    group.members.push(req.user._id);
    await group.save();
    await group.populate('members', 'name email');

    res.json({ message: 'Joined group successfully', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getMyGroups, getGroupById, addMember, removeMember, deleteGroup, renameGroup, generateInvite, joinByInvite };
