const express = require("express");
const User = require("../models/User");
const UserCourse = require("../models/UserCourse");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');
const fs = require('fs');

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

// Now initialize multer
const upload = multer({ storage: storage });


// Add user-courses mapping
router.post("/add", upload.none(), async (req, res) => {
  try {
    const { userId, courseIds } = req.body; // Expecting an array of courseIds

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected" });
    }

    const results = [];
    for (const courseId of courseIds) {
      // Skip duplicates
      const existingMapping = await UserCourse.findOne({ userId, courseId });
      if (existingMapping) {
        results.push({ courseId, message: "Already enrolled" });
        continue;
      }

      const newUserCourse = new UserCourse({
        userId,
        courseId,
        status: "active",
      });

      await newUserCourse.save();
      results.push({ courseId, message: "Enrolled successfully" });
    }

    res.status(201).json({
      success: true,
      message: "User enrolled in selected courses successfully",
      details: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Server error while mapping courses",
    });
  }
});

// Get courses by user ID
router.get("/userId/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all course mappings for this user and populate course details
    const userCourses = await UserCourse.find({ userId }).populate("courseId");

    if (!userCourses || userCourses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No courses found for this user",
        courses: []
      });
    }

    // Extract course details for frontend
    const courses = userCourses.map((uc) => uc.courseId);

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      courses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
      error: error.message
    });
  }
});

// Get users by course ID
router.get("/courseId/:courseId", async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Find all user mappings for this course and populate user details
    const courseUsers = await UserCourse.find({ courseId }).populate("userId");

    if (!courseUsers || courseUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found for this course",
        users: []
      });
    }

    // Extract user details for frontend
    const users = courseUsers.map((cu) => cu.userId);

    res.status(200).json({
      success: true, 
      message: "Users retrieved successfully",
      users
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message
    });
  }
});


// Delete user-course mapping by userId and courseId
router.delete("/delete/userId/:userId/courseId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Find and delete the user-course mapping
    const deletedUserCourse = await UserCourse.findOneAndDelete({ 
      userId: userId,
      courseId: courseId 
    });

    if (!deletedUserCourse) {
      return res.status(404).json({
        success: false,
        message: "User-course mapping not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User-course mapping deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false, 
      message: "Server error while deleting user-course mapping",
      error: error.message
    });
  }
});

module.exports = router;


