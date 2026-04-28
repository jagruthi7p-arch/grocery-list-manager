const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    listName: {
      type: String,
      required: [true, 'List name is required'],
      trim: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('List', listSchema);
