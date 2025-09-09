const express = require("express");
const Forum = require("../models/Forum");
const User = require("../models/User");
const Batch = require("../models/Batch");
const mongoose = require("mongoose");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/forum"); // Folder where the image will be saved
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

//add forum
router.post("/add", upload.none(), async (req, res) => {
  try {

    // Check if user exists
    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User ID does not exist" });
    }

    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch ID does not exist" });
    }

    // Validate required fields
    if (!req.body.topic) {
      return res.status(400).json({ message: "Forum topic is required" });
    }

    if (!req.body.description) {
      return res.status(400).json({ message: "Forum description is required" });
    }

    // Create new forum entry
    const forum = new Forum({
      batchId: req.body.batchId,
      userId: req.body.userId,
      topic: req.body.topic,
      description: req.body.description,
      status: "open"
    });

    // Save forum
    const savedForum = await forum.save();

    res.status(200).json({
      forum: savedForum,
      message: "Forum added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get all fourms with pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get forums with pagination
    const forums = await Forum.find({ status: "active" })
      .populate('userId')
      .populate('batchId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count of forums
    const totalForums = await Forum.countDocuments({ status: "active" });

    // Calculate total pages
    const totalPages = Math.ceil(totalForums / limit);

    res.status(200).json({
      forums: forums,
      currentPage: page,
      totalPages: totalPages,
      totalForums: totalForums,
      message: "Forums retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get forum by id
router.get("/fId/:id", async (req, res) => {
  try {
    // Validate forum ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid forum ID format" });
    }

    // Find forum by ID
    const forum = await Forum.findOne({
      _id: req.params.id,
    }).populate('userId')
      .populate('batchId');

    // Check if forum exists
    if (!forum) {
      return res.status(400).json({ message: "Forum not found" });
    }

    res.status(200).json({
      forum: forum,
      message: "Forum retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get forums by batchId with pagination
router.get("/batchId/:batchId", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate batchId format
    if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    // Check if batch exists
    const batchExists = await Batch.findById(req.params.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch not found" });
    }

    // Find forums with pagination
    const forums = await Forum.find({
      batchId: req.params.batchId,
    })
    .populate('userId')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    // Get total count of forums
    const totalForums = await Forum.countDocuments({
      batchId: req.params.batchId,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalForums / limit);

    res.status(200).json({
      forums: forums,
      currentPage: page,
      totalPages: totalPages,
      totalForums: totalForums,
      message: "Forums retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get forum by userId with pagination
router.get("/userId/:userId", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
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

    // Find forums with pagination
    const forums = await Forum.find({
      userId: req.params.userId,
    })
    .populate('batchId')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    // Get total count of forums
    const totalForums = await Forum.countDocuments({
      userId: req.params.userId,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalForums / limit);

    res.status(200).json({
      forums: forums,
      currentPage: page,
      totalPages: totalPages,
      totalForums: totalForums,
      message: "Forums retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/userId/:userId/batchId/:batchId", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Validate batchId format 
    if (!mongoose.Types.ObjectId.isValid(req.params.batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    // Check if user exists
    const userExists = await User.findById(req.params.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if batch exists
    const batchExists = await Batch.findById(req.params.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch not found" });
    }

    // Find forums with pagination
    const forums = await Forum.find({
      userId: req.params.userId,
      batchId: req.params.batchId,
    })
    .populate('userId')
    .populate('batchId')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    // Get total count of forums
    const totalForums = await Forum.countDocuments({
      userId: req.params.userId,
      batchId: req.params.batchId, 
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalForums / limit);

    res.status(200).json({
      forums: forums,
      currentPage: page,
      totalPages: totalPages,
      totalForums: totalForums,
      message: "Forums retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
