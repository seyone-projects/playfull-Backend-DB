const express = require("express");
const Attendance = require("../models/Attendance");
const app = express();
app.use(express.json());

const router = express.Router();

//get all attendances with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const attendances = await Attendance.find()
      .populate("userId")
      .populate({
        path: "batchId",
        populate: {
          path: "courseId",
          populate: [
            { path: "categoryId", model: "Category" },
            { path: "subCategoryIds", model: "SubCategory" }
          ]
        }
      })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      attendances,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "All attendances retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendances", error: err });
  }
});

//get attendance by id with populate userId
router.get("/aId/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate("userId")
      .populate({
        path: "batchId",
        populate: {
          path: "courseId",
          populate: [
            { path: "categoryId", model: "Category" },
            { path: "subCategoryIds", model: "SubCategory" }
          ]
        }
      });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.status(200).json({
      attendance,
      message: "Attendance retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err });
  }
});


//get attandences by lessonPlannerId with pagination
router.get("/lessonPlannerId/:lessonPlannerId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const lessonPlannerId = req.params.lessonPlannerId;

    const attendances = await Attendance.find({
      lessonPlannerId: lessonPlannerId
    })
      .populate("userId")
      .populate({
        path: "batchId",
        populate: {
          path: "courseId",
          populate: [
            { path: "categoryId", model: "Category" },
            { path: "subCategoryIds", model: "SubCategory" }
          ]
        }
      })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments({
      lessonPlannerId: lessonPlannerId
    });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      attendances,
      currentPage: page, 
      totalPages,
      totalItems: total,
      message: "Attendances for lesson planner retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching attendances for lesson planner",
      error: err
    });
  }
});

module.exports = router;
