const express = require("express");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const LessonPlanner = require("../models/LessonPlanner");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const { sendHtmlEmail } = require("./mailRoutes");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/leaveRequest"); // Folder where the image will be saved
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


//add leaveRequest 
router.post("/add", upload.none(), async (req, res) => {
  try {

    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ message: "User ID does not exist" });
    }

    const lessonPlannerExists = await LessonPlanner.findById(req.body.lessonPlannerId);
    if (!lessonPlannerExists) {
      return res.status(400).json({ message: "Lesson Planner ID does not exist" });
    }

    //required apply remarks
    if (!req.body.applyRemarks) {
      return res.status(400).json({ message: "Apply Remarks is required" });
    }

    // Create new leaveRequest  entry
    const leaveRequest = new LeaveRequest({
      userId: req.body.userId,
      lessonPlannerId: req.body.lessonPlannerId,
      applyRemarks: req.body.applyRemarks,
      appliedDateTime: new Date(),
      responseRemarks: req.body.responseRemarks,
      reponseDateTime: new Date(),
      status: "pending"
    });

    // Save leaveRequest 
    const savedLeaveRequest = await leaveRequest.save();

    res.status(200).json({
      leaveRequest: savedLeaveRequest,
      message: "LeaveRequest added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//update leaveRequest
router.post("/update/:id", upload.none(), async (req, res) => {
  try {
    const leaveRequestId = req.params.id;

    // Check if leaveRequest exists and populate user + lessonPlanner
    const leaveRequestExists = await LeaveRequest.findById(leaveRequestId)
      .populate("userId")           // populate user details
      .populate("lessonPlannerId"); // populate lesson planner details

    if (!leaveRequestExists) {
      return res.status(404).json({ message: "Leave Request not found" });
    }

    // Update leaveRequest
    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
      leaveRequestId,
      {
        responseRemarks: req.body.responseRemarks,
        status: req.body.status,
        reponseDateTime: new Date()
      },
      { new: true }
    )
      .populate("userId")           // populate after update also
      .populate("lessonPlannerId");

    const formattedDate = new Date(updatedLeaveRequest.lessonPlannerId.lessonDate)
      .toLocaleDateString("en-GB"); // dd/mm/yyyy
    
    let subject = "";
    let htmlContent = "";

    if (updatedLeaveRequest.status === "declined") {
      subject = `Leave request Rejected - [ ${formattedDate} ]`;
      htmlContent = `
        <h3>Dear ${updatedLeaveRequest.userId.username},</h3>
        <p>Your leave request has been <b>rejected</b>. Below is the message from the admin,</p>
        <p>${updatedLeaveRequest.responseRemarks || ""}</p>
        <p>Best regards,<br/><b>Playful Pencil Team</b></p>
      `;
    } else if (updatedLeaveRequest.status === "approved") {
      subject = `Leave request Approved - [ ${formattedDate} ]`;
      htmlContent = `
        <h3>Dear ${updatedLeaveRequest.userId.username},</h3>
        <p>Your leave request has been <b>approved</b>. Below is the message from the admin,</p>
        <p>${updatedLeaveRequest.responseRemarks || ""}</p>
        <p>Best regards,<br/><b>Playful Pencil Team</b></p>
      `;
    }

    // Send email if subject/content is set
    if (subject && htmlContent) {
      await sendHtmlEmail(updatedLeaveRequest.userId.email, subject, htmlContent);
    }    

    // Declare variable outside
    let savedAttendance = null;

    if (updatedLeaveRequest.status === "approved") {
      // Delete old attendance for same lessonPlanner + user
      await Attendance.deleteOne({
        lessonPlannerId: updatedLeaveRequest.lessonPlannerId._id,
        userId: updatedLeaveRequest.userId._id
      });

      // Create new attendance entry
      const attendance = new Attendance({
        batchId: updatedLeaveRequest.lessonPlannerId.batchId,
        userId: updatedLeaveRequest.userId,
        lessonPlannerId: updatedLeaveRequest.lessonPlannerId,
        attendanceDate: updatedLeaveRequest.lessonPlannerId.lessonDate,
        attendanceStatus: "absent",
        remarks:
          "Request - " +
          updatedLeaveRequest.applyRemarks +
          "<br/>Response - " +
          updatedLeaveRequest.responseRemarks,
        status: "active"
      });

      // Save attendance
      savedAttendance = await attendance.save();
    }


    res.status(200).json({
      leaveRequest: updatedLeaveRequest,
      attendance: savedAttendance,
      message: "Leave Request updated successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//get all leave requests with pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of documents
    const total = await LeaveRequest.countDocuments();

    // Get paginated leave requests with user and lesson planner details populated
    const leaveRequests = await LeaveRequest.find()
      .populate('userId')
      .populate({
        path: 'lessonPlannerId',
        populate: {
          path: 'batchId',
          model: 'Batch'
        }
      })

      .skip(skip)
      .limit(limit)
      .sort({ appliedDateTime: -1 });

    res.status(200).json({
      leaveRequests,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get leave requests by lessonplannerId with pagination
router.get("/lessonplanner/:lessonPlannerId", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of documents
    const total = await LeaveRequest.countDocuments({ lessonPlannerId: req.params.lessonPlannerId });

    // Get paginated leave requests with user and lesson planner details populated
    const leaveRequests = await LeaveRequest.find({ lessonPlannerId: req.params.lessonPlannerId })
      .populate('userId')
      .populate({
        path: 'lessonPlannerId',
        populate: {
          path: 'batchId',
          model: 'Batch'
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ appliedDateTime: -1 });

    res.status(200).json({
      leaveRequests,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get leave requests by lesson planner id and user id with pagination
router.get("/lessonplannerId/:lessonPlannerId/userId/:userId", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of documents matching both lessonPlannerId and userId
    const total = await LeaveRequest.countDocuments({
      lessonPlannerId: req.params.lessonPlannerId,
      userId: req.params.userId
    });

    // Get paginated leave requests with user and lesson planner details populated
    const leaveRequests = await LeaveRequest.find({
      lessonPlannerId: req.params.lessonPlannerId,
      userId: req.params.userId
    })
      .populate('userId')
      .populate({
        path: 'lessonPlannerId',
        populate: {
          path: 'batchId',
          model: 'Batch'
        }
      })
      .skip(skip)
      .limit(limit)
      .sort({ appliedDateTime: -1 });

    res.status(200).json({
      leaveRequests,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
