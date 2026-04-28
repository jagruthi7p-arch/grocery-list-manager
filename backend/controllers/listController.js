const List = require('../models/List');
const Group = require('../models/Group');

// Verify user is member of group
const verifyGroupMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return null;
  const isMember = group.members.some((m) => m.toString() === userId.toString());
  return isMember ? group : null;
};

// POST /api/lists
const createList = async (req, res) => {
  try {
    const { listName, groupId } = req.body;
    if (!listName || !groupId) return res.status(400).json({ message: 'listName and groupId are required' });

    const group = await verifyGroupMember(groupId, req.user._id);
    if (!group) return res.status(403).json({ message: 'Access denied or group not found' });

    const list = await List.create({ listName, groupId, createdBy: req.user._id });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lists/group/:groupId
const getListsByGroup = async (req, res) => {
  try {
    const group = await verifyGroupMember(req.params.groupId, req.user._id);
    if (!group) return res.status(403).json({ message: 'Access denied or group not found' });

    const lists = await List.find({ groupId: req.params.groupId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lists/:id
const getListById = async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate('createdBy', 'name');
    if (!list) return res.status(404).json({ message: 'List not found' });

    const group = await verifyGroupMember(list.groupId, req.user._id);
    if (!group) return res.status(403).json({ message: 'Access denied' });

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/lists/:id
const updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });

    const group = await verifyGroupMember(list.groupId, req.user._id);
    if (!group) return res.status(403).json({ message: 'Access denied' });

    list.listName = req.body.listName || list.listName;
    const updated = await list.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/lists/:id
const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });

    const group = await verifyGroupMember(list.groupId, req.user._id);
    if (!group) return res.status(403).json({ message: 'Access denied' });

    await list.deleteOne();
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createList, getListsByGroup, getListById, updateList, deleteList };
