const express = require("express");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Batch = require("../models/Batch");
const LessonPlanner = require("../models/LessonPlanner");
const mongoose = require("mongoose");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/attendance"); // Folder where the image will be saved
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


//add attendance 
router.post("/add", upload.none(), async (req, res) => {
  try {

    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User ID does not exist" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.body.batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch ID does not exist" });
    }    

    const lessonPlannerExists = await LessonPlanner.findById(req.body.lessonPlannerId);
    if (!lessonPlannerExists) {
      return res.status(400).json({ message: "Lesson Planner ID does not exist" });
    }

    // Create new attendance  entry
    const attendance = new Attendance({
      batchId: req.body.batchId,
      userId: req.body.userId,
      lessonPlannerId: req.body.lessonPlannerId,
      attendanceDate: req.body.attendanceDate,
      attendanceStatus: req.body.attendanceStatus,
      remarks: req.body.remarks,
      status: "active"
    });

    // Save attendance 
    const savedAttendance = await attendance.save();

    res.status(200).json({
      attendance: savedAttendance,
      message: "Attendance added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//update attendance 
router.post("/update/:id", upload.none(), async (req, res) => {
  try {
    const attendanceId = req.params.id;

    // Check if attendance exists
    const attendanceExists = await Attendance.findById(attendanceId);
    if (!attendanceExists) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    // Check if user exists if userId is being updated
    if (req.body.userId) {
      const userExists = await User.findById(req.body.userId);
      if (!userExists) {
        return res.status(400).json({ message: "User ID does not exist" });
      }
    }

    //check if batch exists if batchId is being updated
    if (req.body.batchId) {
      const batchExists = await Batch.findById(req.body.batchId);
      if (!batchExists) {
        return res.status(400).json({ message: "Batch ID does not exist" });
      }
    }

    if (req.body.lessonPlannerId) {
      const lessonPlannerExists = await LessonPlanner.findById(req.body.lessonPlannerId);
      if (!lessonPlannerExists) {
        return res.status(400).json({ message: "Lesson Planner ID does not exist" });
      }
    }

    // Update attendance 
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          batchId: req.body.batchId,
          userId: req.body.userId,
          lessonPlannerId: req.body.lessonPlannerId,
          attendanceDate: req.body.attendanceDate,
          attendanceStatus: req.body.attendanceStatus,
          remarks: req.body.remarks,
          status: req.body.status
        }
      },
      { new: true }
    );

    res.status(200).json({
      attendance: updatedAttendance,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//delete attendance by batchId and lessonplannerId
router.delete("/delete/:batchId/:lessonPlannerId", async (req, res) => {
  try {
    const { batchId, lessonPlannerId } = req.params;

    // Validate batchId format
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    // Check if batch exists
    const batchExists = await Batch.findById(batchId);
    if (!batchExists) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check if lesson planner exists
    const lessonPlannerExists = await LessonPlanner.findById(lessonPlannerId);
    if (!lessonPlannerExists) {
      return res.status(404).json({ message: "Lesson planner not found" });
    }

    // Delete attendance records matching batchId and lessonPlannerId
    const result = await Attendance.deleteMany({ 
      batchId: batchId,
      lessonPlannerId: lessonPlannerId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No attendance records found to delete" });
    }

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} attendance records`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// delete only student attendance for batch + lessonPlanner
router.delete("/delete-students/:batchId/:lessonPlannerId", async (req, res) => {
  try {
    const { batchId, lessonPlannerId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(lessonPlannerId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Get batch with users array
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    // Collect only userIds (students)
    const studentIds = batch.users.map(u => u.userId);

    // Delete attendance only for students in this batch
    const result = await Attendance.deleteMany({
      batchId,
      lessonPlannerId,
      userId: { $in: studentIds }  // only deletes mapped students
    });

    res.status(200).json({
      message: `Deleted ${result.deletedCount} student attendance records`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




module.exports = router;
