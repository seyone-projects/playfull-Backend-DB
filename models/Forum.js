const mongoose = require("mongoose");

const ForumSchema = new mongoose.Schema(
  {
    batchId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    counts: {
      type: Number, 
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Forum = mongoose.model("Forum", ForumSchema);

module.exports = Forum;
