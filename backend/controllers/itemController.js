const Item = require('../models/Item');
const List = require('../models/List');
const Group = require('../models/Group');

// SSE clients store: listId -> Set of response objects
const sseClients = new Map();

const broadcastToList = (listId, data) => {
  const clients = sseClients.get(listId.toString());
  if (clients) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => res.write(payload));
  }
};

// Verify user is member of the list's group
const verifyListAccess = async (listId, userId) => {
  const list = await List.findById(listId);
  if (!list) return null;
  const group = await Group.findById(list.groupId);
  if (!group) return null;
  const isMember = group.members.some((m) => m.toString() === userId.toString());
  return isMember ? list : null;
};

// GET /api/items/stream/:listId  (SSE)
const streamItems = async (req, res) => {
  const { listId } = req.params;

  const list = await verifyListAccess(listId, req.user._id);
  if (!list) return res.status(403).json({ message: 'Access denied' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(listId)) sseClients.set(listId, new Set());
  sseClients.get(listId).add(res);

  // Send current items immediately
  const items = await Item.find({ listId }).populate('addedBy', 'name').populate('purchasedBy', 'name').sort({ category: 1 });
  res.write(`data: ${JSON.stringify({ type: 'init', items })}\n\n`);

  req.on('close', () => {
    sseClients.get(listId)?.delete(res);
    if (sseClients.get(listId)?.size === 0) sseClients.delete(listId);
  });
};

// GET /api/items/list/:listId
const getItemsByList = async (req, res) => {
  try {
    const list = await verifyListAccess(req.params.listId, req.user._id);
    if (!list) return res.status(403).json({ message: 'Access denied' });

    const items = await Item.find({ listId: req.params.listId })
      .populate('addedBy', 'name')
      .populate('purchasedBy', 'name')
      .sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/items
const addItem = async (req, res) => {
  try {
    const { name, quantity, listId } = req.body;
    const category = req.body.category ? req.body.category.trim() : 'Other';
    if (!name || !listId) return res.status(400).json({ message: 'name and listId are required' });

    const list = await verifyListAccess(listId, req.user._id);
    if (!list) return res.status(403).json({ message: 'Access denied' });

    const item = await Item.create({ name, category, quantity, listId, addedBy: req.user._id });
    await item.populate('addedBy', 'name');

    broadcastToList(listId, { type: 'add', item });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/items/:id
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const list = await verifyListAccess(item.listId, req.user._id);
    if (!list) return res.status(403).json({ message: 'Access denied' });

    const { name, quantity } = req.body;
    const category = req.body.category !== undefined ? req.body.category.trim() : undefined;
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (quantity !== undefined) item.quantity = quantity;

    const updated = await item.save();
    await updated.populate('addedBy', 'name');
    await updated.populate('purchasedBy', 'name');

    broadcastToList(item.listId, { type: 'update', item: updated });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/items/:id/purchased
const togglePurchased = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const list = await verifyListAccess(item.listId, req.user._id);
    if (!list) return res.status(403).json({ message: 'Access denied' });

    item.isPurchased = !item.isPurchased;
    item.purchasedAt = item.isPurchased ? new Date() : null;
    item.purchasedBy = item.isPurchased ? req.user._id : null;
    const updated = await item.save();
    await updated.populate('addedBy', 'name');
    await updated.populate('purchasedBy', 'name');

    // Check if all items in the list are now purchased
    const allItems = await Item.find({ listId: item.listId });
    const allDone = allItems.length > 0 && allItems.every((i) => i.isPurchased);
    const listDoc = await list.constructor.findById ? list : await require('../models/List').findById(item.listId);
    const List = require('../models/List');
    const listRecord = await List.findById(item.listId);
    if (listRecord) {
      listRecord.completedAt = allDone ? new Date() : null;
      await listRecord.save();
      broadcastToList(item.listId, { type: 'listStatus', completedAt: listRecord.completedAt });
    }

    broadcastToList(item.listId, { type: 'update', item: updated });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const list = await verifyListAccess(item.listId, req.user._id);
    if (!list) return res.status(403).json({ message: 'Access denied' });

    const listId = item.listId;
    await item.deleteOne();

    broadcastToList(listId, { type: 'delete', itemId: req.params.id });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { streamItems, getItemsByList, addItem, updateItem, togglePurchased, deleteItem };
