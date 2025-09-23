const express = require("express");
const LessonPlanner = require("../models/LessonPlanner");
const BatchStudent = require("../models/BatchStudent");
const app = express();
app.use(express.json());

const router = express.Router();

//get all lesson planners with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const lessonPlanners = await LessonPlanner.find()
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

    const total = await LessonPlanner.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page, 
      totalPages,
      totalItems: total,
      message: "Lesson planners retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching lesson planners", error: err });
  }
});

//GET all today's lesson planners with pagination
router.get("/today", async (req, res) => {
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


router.get("/today/student/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get userId from params instead of req.user
    const userId = req.params.userId;

    // Find the batches this student is mapped to
    const mappedBatches = await BatchStudent.find({ userId, status: "active" }).select("batchId");
    const batchIds = mappedBatches.map(b => b.batchId);

    // Today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query lesson planners
    const query = {
      lessonDate: { $gte: today, $lt: tomorrow },
      batchId: { $in: batchIds }
    };

    const lessonPlanners = await LessonPlanner.find(query)
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

    const total = await LessonPlanner.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      lessonPlanners,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Today's lesson planners retrieved successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching today's lesson planners",
      error: err
    });
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


//need a route to get the summary of the lessonplanners in a give month-year
router.get("/monthly-summary", async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month) - 1;
    const userId = req.query.userId; // Get userId from query

    if (!userId || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ message: "UserId, year, and month are required and must be valid" });
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Step 1: Get all active batch mappings for the user
    const batchStudents = await BatchStudent.find({
      status: "active",
      userId: userId
    }).populate("userId");

    // Step 2: Extract unique batch IDs
    const batchIds = [...new Set(batchStudents.map(bs => bs.batchId))];

    // Step 3: Get lesson planners for only these batches
    const lessonPlanners = await LessonPlanner.find({
      lessonDate: { $gte: startDate, $lte: endDate },
      batchId: { $in: batchIds }
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
      });

    // Initialize summary
    const summary = {
      totalLessons: lessonPlanners.length,
      uniqueBatches: batchIds.length,
      uniqueTrainers: [...new Set(lessonPlanners.map(lp => lp.trainerId._id.toString()))].length,
      totalStudents: batchStudents.length,
      lessonsByDate: {},
      batchWiseSummary: {},
      lessonDetails: [],
      totalHours: 0,
      totalCompleted: 0
    };

    // Collect lesson details and compute totals
    lessonPlanners.forEach(lesson => {
      summary.lessonDetails.push({
        topic: lesson.lessonTopic || "",
        batchName: lesson.batchId?.name || "",
        trainerName: lesson.trainerId?.username || "",
        lessonDate: lesson.lessonDate,
        lessonTime: lesson.lessonTime || "",
        lessonDuration: lesson.lessonDuration || 0,
        status: lesson.status || ""
      });

      if (lesson.lessonDuration) summary.totalHours += lesson.lessonDuration;
      if (lesson.status === "completed") summary.totalCompleted += 1;
    });

    // Group lessons and students by batch
    batchIds.forEach(batchId => {
      const batchLessons = lessonPlanners.filter(lp => lp.batchId._id.toString() === batchId.toString());
      const batchStudentCount = batchStudents.filter(bs => bs.batchId.toString() === batchId.toString()).length;

      summary.batchWiseSummary[batchId] = {
        totalLessons: batchLessons.length,
        studentCount: batchStudentCount,
        batchDetails: batchLessons[0]?.batchId
      };
    });

    // Group lessons by date
    lessonPlanners.forEach(lesson => {
      const date = lesson.lessonDate.toISOString().split("T")[0];
      if (!summary.lessonsByDate[date]) summary.lessonsByDate[date] = [];
      summary.lessonsByDate[date].push({
        lesson,
        studentCount: batchStudents.filter(bs => bs.batchId.toString() === lesson.batchId._id.toString()).length
      });
    });

    // Final response
    res.status(200).json({
      summary,
      totalLessons: summary.totalLessons,
      completedLessons: summary.totalCompleted,
      pendingLessons: summary.totalLessons - summary.totalCompleted,
      message: `Lesson planner summary for user ${userId} retrieved successfully for ${month + 1}/${year}`
    });

  } catch (err) {
    res.status(500).json({
      message: "Error fetching lesson planner summary with students",
      error: err
    });
  }
});


module.exports = router;
