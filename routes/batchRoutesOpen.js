const express = require("express");
const Batch = require("../models/Batch");
const User = require("../models/User");
const app = express();
app.use(express.json());

const router = express.Router();


//get all batch with pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of documents
    const total = await Batch.countDocuments();

    // Get paginated results
    const batchs = await Batch.find()
      .populate("trainerId")
      .populate({
        path: 'courseId',
        populate: [
          { path: 'categoryId', model: 'Category' },
          { path: 'subCategoryIds', model: 'SubCategory' }
        ]
      })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      batchs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      message: "Batchs retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching batchs", error: err.message });
  }
});

//get users by batch id with pagination
router.get("/:batchId/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const batch = await Batch.findById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const userRefs = batch.users || [];
    const total = userRefs.length;
    const paginatedUsers = userRefs.slice(skip, skip + limit);

    const userIds = paginatedUsers.map((u) => u.userId);
    const users = await User.find({ _id: { $in: userIds } });

    const usersWithJoiningDate = users.map((user) => ({
      ...user.toObject(),
      joiningDate: user.joiningDate // ✅ Use from User model
    }));

    res.status(200).json({
      users: usersWithJoiningDate,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      message: "Users retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});


//get by id
router.get("/bId/:id", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('trainerId')
      .populate({
        path: 'courseId',
        populate: [
          { path: 'categoryId', model: 'Category' },
          { path: 'subCategoryIds', model: 'SubCategory' }
        ]
      })
    if (!batch) {
      return res.status(400).json({ batch: batch, message: "Batch not found" });
    }
    else {
      res.status(200).json({ batch: batch, message: "Batch retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching batch", error: err.message });
  }
});

//get batchs by trainer id with pagination
router.get("/trainer/:trainerId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Batch.countDocuments({ trainerId: req.params.trainerId });

    const batches = await Batch.find({ trainerId: req.params.trainerId })
      .populate("trainerId")
      .populate("courseId")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      batches,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      message: "Batches retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching batches", error: err.message });
  }
});

//get batchs by student id with pagination
router.get("/student/:studentId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find batches where the student ID exists in the users array
    const total = await Batch.countDocuments({
      "users.userId": req.params.studentId
    });

    const batches = await Batch.find({
      "users.userId": req.params.studentId
    })
      .populate("trainerId")
      .populate("courseId")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      batches,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      message: "Batches retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching batches", error: err.message });
  }
});

module.exports = router;
