const express = require("express");
const LessonPlanner = require("../models/LessonPlanner");
const app = express();
app.use(express.json());

const router = express.Router();

//GET all today's lesson planners with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Set today's date to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set tomorrow's date to midnight 
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lessonPlanners = await LessonPlanner.find({
      lessonDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate("trainerId")
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

    const total = await LessonPlanner.countDocuments({
      lessonDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Today's lesson planners retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching today's lesson planners", error: err });
  }
});


//get lesson planner by id with populate trainerId
router.get("/lpId/:id", async (req, res) => {
  try {
    const lessonPlanner = await LessonPlanner.findById(req.params.id)
      .populate("trainerId")
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

    if (!lessonPlanner) {
      return res.status(404).json({ message: "Lesson planner not found" });
    }

    res.status(200).json({
      lessonPlanner,
      message: "Lesson planner retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching lesson planner", error: err });
  }
});


//get lesson planners by batch id with pagination
router.get("/batchId/:batchId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const batchId = req.params.batchId;

    const lessonPlanners = await LessonPlanner.find({ batchId: batchId })
      .populate("trainerId")
      .skip(skip)
      .limit(limit);

    const total = await LessonPlanner.countDocuments({ batchId: batchId });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Lesson planners for batch retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching lesson planners for batch", error: err });
  }
});


// GET today's lesson planners by trainer ID with pagination
router.get("/trainerId/:trainerId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trainerId = req.params.trainerId;

    // Set today's date to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set tomorrow's date to midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query lesson planners for this trainer and today's date
    const lessonPlanners = await LessonPlanner.find({
      trainerId: trainerId,
      lessonDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate({
        path: "batchId",
        populate: {
          path: "courseId",
          populate: [
            { path: "categoryId", model: "Category" },
            { path: "subCategoryIds", model: "SubCategory" }  // plural form for array
          ]
        }
      })
      .skip(skip)
      .limit(limit);

    // Count total matching records
    const total = await LessonPlanner.countDocuments({
      trainerId: trainerId,
      lessonDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Today's lesson planners for trainer retrieved successfully"
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      message: "Error fetching lesson planners for trainer",
      error: err
    });
  }
});

//get lesson planners by batch id and trainer id with pagination
router.get("/batchId/:batchId/trainerId/:trainerId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const batchId = req.params.batchId;
    const trainerId = req.params.trainerId;

    const lessonPlanners = await LessonPlanner.find({
      batchId: batchId,
      trainerId: trainerId
    })
      .populate("trainerId")
      .skip(skip)
      .limit(limit);

    const total = await LessonPlanner.countDocuments({
      batchId: batchId,
      trainerId: trainerId
    });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Lesson planners for batch and trainer retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching lesson planners for batch and trainer",
      error: err
    });
  }
});



module.exports = router;
