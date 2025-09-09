const mongoose = require("mongoose");

const ForumReplySchema = new mongoose.Schema(
  {
    forumId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Forum',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const ForumReply = mongoose.model("ForumReply", ForumReplySchema);

module.exports = ForumReply;
