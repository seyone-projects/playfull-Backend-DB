const express = require("express");
const Attendance = require("../models/Attendance");
const BatchStudent = require("../models/BatchStudent");
const Batch = require("../models/Batch");
const User = require("../models/User");
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


//get attendance by fromdate, todate, batchId  with pagination
router.get("/batchwise-attendance-report", async (req, res) => {
  try {
    const { fromDate, toDate, batchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by batchId
    if (batchId && batchId !== "overall") {
      query.batchId = batchId;
    }

    // Ensure only student attendance (exclude trainer users)
    const studentIds = await User.find({ role: "student" }).select("_id");
    query.userId = { $in: studentIds.map(s => s._id) };

    // Date filter
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = {
        $gte: start,
        $lte: end
      };
    }

    // Fetch attendance data with pagination
    const attendances = await Attendance.find(query)
      .populate("userId") // student details only
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
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(limit);

    // Total attendance count for pagination
    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students (unique student count only)
    const uniqueStudents = await Attendance.distinct("userId", query);
    const totalStudents = uniqueStudents.length;

    // Attendance summary
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAttendance: { $sum: 1 },
          uniqueStudents: { $addToSet: "$userId" }
        }
      }
    ]);

    const summaryData = attendanceSummary.length
      ? {
        totalAttendance: attendanceSummary[0].totalAttendance,
        uniqueStudents: attendanceSummary[0].uniqueStudents.length
      }
      : { totalAttendance: 0, uniqueStudents: 0 };

    res.status(200).json({
      success: true,
      data: {
        attendances,
        currentPage: page,
        totalPages,
        totalItems: total,
        totalStudents,
        summary: summaryData
      },
      message: "Batch-wise student attendance report generated successfully"
    });

  } catch (err) {
    console.error("Error generating batch-wise student attendance report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating batch-wise student attendance report",
      error: err
    });
  }
});

router.get("/studentwise-attendance-report", async (req, res) => {
  try {
    const { fromDate, toDate, studentId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    //Get only student userIds
    const studentUsers = await User.find({ role: "student" }).select("_id");
    const studentIds = studentUsers.map(s => s._id);

    query.userId = { $in: studentIds };

    if (studentId && studentId !== "overall") {
      query.userId = studentId; // still allow filtering by a specific student
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = {
        $gte: start,
        $lte: end
      };
    }

    // Fetch attendance data with pagination
    const attendances = await Attendance.find(query)
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
      .populate("lessonPlannerId")
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(limit);

    // Total attendance count for pagination
    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total batches attended by the student
    let totalBatches = 0;
    if (studentId && studentId !== "overall") {
      const batchIds = await Attendance.distinct("batchId", { userId: studentId });
      totalBatches = batchIds.length;
    }

    // Attendance summary
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$userId",
          totalAttendance: { $sum: 1 },
          uniqueBatches: { $addToSet: "$batchId" }
        }
      }
    ]);

    // Prepare summary data
    let summaryData = { totalAttendance: 0, totalBatches: 0 };
    if (attendanceSummary.length) {
      summaryData.totalAttendance = attendanceSummary[0].totalAttendance;
      summaryData.totalBatches = attendanceSummary[0].uniqueBatches.length;
    }

    res.status(200).json({
      success: true,
      data: {
        attendances,
        currentPage: page,
        totalPages,
        totalItems: total,
        totalBatches,
        summary: summaryData
      },
      message: "Student-wise attendance report generated successfully"
    });

  } catch (err) {
    console.error("Error generating student-wise attendance report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating student-wise attendance report",
      error: err
    });
  }
});

router.get("/lessonwise-attendance-report-student", async (req, res) => {
  try {
    const { fromDate, toDate, lessonId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get only student userIds
    const studentUsers = await User.find({ role: "student" }).select("_id");
    const studentIds = studentUsers.map(s => s._id);

    // Build query object
    const query = { userId: { $in: studentIds } };

    if (lessonId && lessonId !== "overall") {
      query.lessonPlannerId = lessonId; // Attendance has lessonPlannerId
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.attendanceDate = {
        $gte: start,
        $lte: end
      };
    }

    // Fetch attendance data with pagination
    // Inside your attendance report API
    const attendances = await Attendance.find(query)
      .populate({
        path: "lessonPlannerId",
        populate: {
          path: "batchId",
          populate: {
            path: "courseId",
            populate: [
              { path: "categoryId", model: "Category" },
              { path: "subCategoryIds", model: "SubCategory" }
            ]
          }
        }
      })
      .populate("userId")  // <-- populate student
      .skip(skip)
      .limit(limit);

    // Total attendance count for pagination
    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students in this lesson
    let totalStudents = 0;
    if (lessonId && lessonId !== "overall") {
      const lessonStudents = await Attendance.find({
        lessonPlannerId: lessonId,
        userId: { $in: studentIds }
      }).distinct("userId");
      totalStudents = lessonStudents.length;
    }

    // Attendance summary per lesson
    const attendanceSummary = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$lessonPlannerId",
          totalAttendance: { $sum: 1 },
          uniqueStudents: { $addToSet: "$userId" }
        }
      }
    ]);

    const summaryData = attendanceSummary.length
      ? {
        totalAttendance: attendanceSummary[0].totalAttendance,
        uniqueStudents: attendanceSummary[0].uniqueStudents.length
      }
      : { totalAttendance: 0, uniqueStudents: 0 };

    res.status(200).json({
      success: true,
      data: {
        attendances,
        currentPage: page,
        totalPages,
        totalItems: total,
        totalStudents,
        summary: summaryData
      },
      message: "Lesson-wise attendance report for students generated successfully"
    });

  } catch (err) {
    console.error("Error generating lesson-wise attendance report for students:", err);
    res.status(500).json({
      success: false,
      message: "Error generating lesson-wise attendance report for students",
      error: err
    });
  }
});

//need a route to get the summary of the attendances in a give month-year
router.get("/monthly-summary", async (req, res) => {
  try {
    const { month, year } = req.query;

    // Validate month and year
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    // Create date range for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance data for the month
    const attendances = await Attendance.aggregate([
      {
        $match: {
          attendanceDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            batchId: "$batchId",
            userId: "$userId"
          },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "present"] }, 1, 0]
            }
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$attendanceStatus", "absent"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get unique batches
    const batchIds = [...new Set(attendances.map(a => a._id.batchId))];
    const batches = await Batch.find({ _id: { $in: batchIds } });

    // Get unique users
    const userIds = [...new Set(attendances.map(a => a._id.userId))];
    const users = await User.find({ _id: { $in: userIds } });

    // Format response
    const summary = batches.map(batch => {
      const batchAttendances = attendances.filter(
        a => a._id.batchId.toString() === batch._id.toString()
      );

      const batchUsers = batchAttendances.map(ba => {
        const user = users.find(u => u._id.toString() === ba._id.userId.toString());
        return {
          id: user._id,
          name: user.username,
          mobile: user.mobile,
          absentCount: ba.absentCount,
          presentCount: ba.presentCount
        };
      });

      return {
        id: batch._id,
        name: batch.name,
        users: batchUsers
      };
    });

    res.status(200).json({
      success: true,
      data: summary,
      message: "Monthly attendance summary retrieved successfully"
    });

  } catch (err) {
    console.error("Error generating monthly attendance summary:", err);
    res.status(500).json({
      success: false,
      message: "Error generating monthly attendance summary",
      error: err
    });
  }
});

module.exports = router;
