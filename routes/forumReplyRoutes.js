const express = require("express");
const ForumReply = require("../models/ForumReply");
const User = require("../models/User");
const Forum = require("../models/Forum");
const mongoose = require("mongoose");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/forumReply"); // Folder where the image will be saved
  },
  // Generating a unique filename for each uploaded file
  filename: function (req, file, cb) {
    const filenameWithoutExt = Date.now().toString(); // Generate a unique filename without extension
    const extension = path.extname(file.originalname); // Extract the extension (e.g., .jpg, .png)
    cb(null, filenameWithoutExt + extension); // Save full filename with extension
  }
});

// Create multer upload instance with the specified storage configuration
const upload = multer({ storage: storage });

//add forum reply
router.post("/add", upload.none(), async (req, res) => {
  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).json({ message: "Please Select user" });
    }

    // Check if user exists
    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User ID does not exist" });
    }

    // Validate forumId
    if (!mongoose.Types.ObjectId.isValid(req.body.forumId)) {
      return res.status(400).json({ message: "Invalid forum ID format" });
    }

    const forumExists = await Forum.findById(req.body.forumId);
    if (!forumExists) {
      return res.status(400).json({ message: "Forum ID does not exist" });
    }

    if (!req.body.description) {
      return res.status(400).json({ message: "Forum reply is required" });
    }

    // Create new forum entry
    const forumReply = new ForumReply({
      forumId: req.body.forumId,
      userId: req.body.userId,
      description: req.body.description,
      status: "active"
    });

    // Save forum
    const savedForumReply = await forumReply.save();

    res.status(200).json({
      forumReply: savedForumReply,
      message: "Forum Reply added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//add forum reply with detect any mobile number or email or web link is present in the description.
router.post("/add-with-detection", upload.none(), async (req, res) => {
  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).json({ message: "Please Select user" });
    }

    // Check if user exists 
    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User ID does not exist" });
    }

    // Validate forumId
    if (!mongoose.Types.ObjectId.isValid(req.body.forumId)) {
      return res.status(400).json({ message: "Invalid forum ID format" });
    }

    const forumExists = await Forum.findById(req.body.forumId);
    if (!forumExists) {
      return res.status(400).json({ message: "Forum ID does not exist" });
    }

    if (!req.body.description) {
      return res.status(400).json({ message: "Forum reply is required" });
    }

    // Regular expressions for detection
    const phoneRegex = /(\+\d{1,3}[-.]?)?\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;

    // Detect presence of sensitive information
    const containsPhone = phoneRegex.test(req.body.description);
    const containsEmail = emailRegex.test(req.body.description);
    const containsUrl = urlRegex.test(req.body.description);

    // Block reply if any sensitive content found
    if (containsPhone || containsEmail || containsUrl) {
      return res.status(400).json({
        detectedContent: {
          containsPhone,
          containsEmail,
          containsUrl
        },
        message: "Forum reply contains restricted information (phone, email, or URL)"
      });
    }

    // Create new forum entry
    const forumReply = new ForumReply({
      forumId: req.body.forumId,
      userId: req.body.userId,
      description: req.body.description,
      status: "active",
      containsSensitiveInfo: {
        phone: containsPhone,
        email: containsEmail,
        url: containsUrl
      }
    });

    // Save forum
    const savedForumReply = await forumReply.save();

    res.status(200).json({
      forumReply: savedForumReply,
      detectedContent: {
        containsPhone,
        containsEmail,
        containsUrl
      },
      message: "Forum Reply added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//get forum by id
router.get("/frId/:id", async (req, res) => {
  try {
    // Validate forum ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid forum ID format" });
    }

    // Find forum by ID
    const forumReply = await ForumReply.findOne({
      _id: req.params.id,
      status: "active"
    }).populate('userId')
      .populate('forumId');

    // Check if forum exists
    if (!forumReply) {
      return res.status(400).json({ message: "Forum Reply not found" });
    }

    res.status(200).json({
      forumReply: forumReply,
      message: "Forum Reply retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get forum replies by forumId with pagination
router.get("/forumId/:forumId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Number of items per page
    const skip = (page - 1) * limit;

    // Validate forumId format
    if (!mongoose.Types.ObjectId.isValid(req.params.forumId)) {
      return res.status(400).json({ message: "Invalid forum ID format" });
    }

    // Check if forum exists
    const forumExists = await Forum.findById(req.params.forumId);
    if (!forumExists) {
      return res.status(400).json({ message: "Forum not found" });
    }

    // Find paginated forum replies
    const forumReplies = await ForumReply.find({
      forumId: req.params.forumId,
      status: "active"
    })
      .populate('userId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalReplies = await ForumReply.countDocuments({
      forumId: req.params.forumId,
      status: "active"
    });

    const totalPages = Math.ceil(totalReplies / limit);

    res.status(200).json({
      forumReplies: forumReplies,
      currentPage: page,
      totalPages: totalPages,
      totalReplies: totalReplies,
      message: "Forum Replies retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get forum by userId with pagination
router.get("/userId/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if user exists
    const userExists = await User.findById(req.params.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    // Find paginated forum replies for user
    const forumReplies = await ForumReply.find({
      userId: req.params.userId,
    })
      .populate('forumId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalReplies = await ForumReply.countDocuments({
      userId: req.params.userId,
    });

    const totalPages = Math.ceil(totalReplies / limit);

    res.status(200).json({
      forumReplies: forumReplies,
      currentPage: page,
      totalPages: totalPages,
      totalReplies: totalReplies,
      message: "Forum Replies retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//delete forum reply
router.delete("/delete/:id", async (req, res) => {
  try {
    // Validate forum reply ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid forum reply ID format" });
    }

    // Find and delete forum reply
    const deletedForumReply = await ForumReply.findByIdAndDelete(req.params.id);

    // Check if forum reply exists
    if (!deletedForumReply) {
      return res.status(400).json({ message: "Forum Reply not found" });
    }

    res.status(200).json({
      message: "Forum Reply deleted successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
