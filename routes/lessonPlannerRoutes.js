const express = require("express");
const LessonPlanner = require("../models/LessonPlanner");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
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
    cb(null, "uploads/lessonPlanner"); // Folder where the image will be saved
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


//add lesson planner
router.post("/add", upload.none(), async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.body.trainerId)) {
      return res.status(400).json({ message: "Please Select trainer" });
    }

    const trainerExists = await User.findById(req.body.trainerId);
    if (!trainerExists) {
      return res.status(400).json({ message: "Trainer ID does not exist" });
    }


    if (!mongoose.Types.ObjectId.isValid(req.body.batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch ID does not exist" });
    }


    // Check if required fields are provided
    if (!req.body.lessonTopic) {
      return res.status(400).json({ message: "Lesson topic is required" });
    }

    if (!req.body.lessonDate) {
      return res.status(400).json({ message: "Lesson date is required" });
    }

    if (!req.body.lessonTime) {
      return res.status(400).json({ message: "Lesson time is required" });
    }

    if (!req.body.lessonDuration || req.body.lessonDuration <= 0) {
      return res.status(400).json({ message: "Valid lesson duration in minutes is required" });
    }

    if (!req.body.lessonDescription) {
      return res.status(400).json({ message: "Lesson description is required" });
    }

    if (!req.body.link) {
      return res.status(400).json({ message: "Link is required" });
    }

    // Create new lesson planner entry
    const lessonPlanner = new LessonPlanner({
      batchId: req.body.batchId,
      trainerId: req.body.trainerId,
      lessonTopic: req.body.lessonTopic,
      lessonDate: req.body.lessonDate,
      lessonTime: req.body.lessonTime,
      lessonDuration: req.body.lessonDuration,
      lessonDescription: req.body.lessonDescription,
      link: req.body.link,
      remarks: req.body.remarks,
      status: "planned"
    });

    // Save lesson planner
    const savedLesson = await lessonPlanner.save();

    // Fetch trainer and course for names
    const trainerData = await User.findById(savedLesson.trainerId).select("username email");
    const courseData = batchExists.courseId
      ? await Course.findById(batchExists.courseId).select("name")
      : null;

    // Email Integration for all batch students
    const allUserIds = batchExists.users.map(u => u.userId);
    const allStudents = await User.find({ _id: { $in: allUserIds } });

    const batchMonth = batchExists.startDate
  ? new Date(batchExists.startDate).toLocaleString("en-GB", { month: "long" })
  : null;


    // format lesson date
    const formattedDate = new Date(savedLesson.lessonDate)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    // format lesson time (hh:mm AM/PM)
    const formattedTime = new Date(`1970-01-01T${savedLesson.lessonTime}`)
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
      .toLowerCase(); // to get "6:00pm" instead of "6:00 PM"

    const subject = `📚 Lesson Plan for ${courseData.name} – ${batchMonth} / ${batchExists.name}`;

    for (const student of allStudents) {
      const htmlContent = `
   <h3>Dear ${student.username},</h3>
<p>Here is your lesson plan to help you prepare in advance:</p>

<p>📌 <b>Batch:</b> ${batchExists.name} (${batchExists.code})<br/>
👨🏫 <b>Trainer:</b> ${trainerData.username}</p>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;">
  <thead style="background-color: #f2f2f2;">
    <tr>
      <th>Date</th>
      <th>Topic / Lesson Title</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${formattedDate}</td>
      <td>${savedLesson.lessonTopic}</td>
      <td>${savedLesson.lessonDescription || "—"}</td>
    </tr>
  </tbody>
</table>

<br/>
<p>👉 Please review the topics beforehand to get the most out of each class.</p>

<p>Best regards,<br/><b>Playful Pencil Team</b></p>
  `;

      await sendHtmlEmail(student.email, subject, htmlContent);
    }

    res.status(200).json({
      lesson: savedLesson,
      message: "Lesson planner added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//update lesson planner
router.post("/update/:id", upload.none(), async (req, res) => {
  try {
    const lessonId = req.params.id;

    // Check if lesson exists
    const lessonExists = await LessonPlanner.findById(lessonId);
    if (!lessonExists) {
      return res.status(404).json({ message: "Lesson planner not found" });
    }

    // Check if trainer exists if trainerId is being updated
    if (req.body.trainerId) {
      const trainerExists = await User.findById(req.body.trainerId);
      if (!trainerExists) {
        return res.status(400).json({ message: "Trainer ID does not exist" });
      }
    }

    //check if batch exists if batchId is being updated
    if (req.body.batchId) {
      const batchExists = await Batch.findById(req.body.batchId);
      if (!batchExists) {
        return res.status(400).json({ message: "Batch ID does not exist" });
      }
    }

    // Validate required fields if they are being updated
    if (req.body.lessonTopic === "") {
      return res.status(400).json({ message: "Lesson topic cannot be empty" });
    }

    if (req.body.lessonDate === "") {
      return res.status(400).json({ message: "Lesson date cannot be empty" });
    }

    if (req.body.lessonTime === "") {
      return res.status(400).json({ message: "Lesson time cannot be empty" });
    }

    if (req.body.lessonDuration && req.body.lessonDuration <= 0) {
      return res.status(400).json({ message: "Lesson duration must be greater than 0" });
    }

    if (req.body.lessonDescription === "") {
      return res.status(400).json({ message: "Lesson description cannot be empty" });
    }

    if (req.body.link === "") {
      return res.status(400).json({ message: "Link cannot be empty" });
    }

    // Update lesson planner
    const updatedLesson = await LessonPlanner.findByIdAndUpdate(
      lessonId,
      {
        $set: {
          batchId: req.body.batchId,
          trainerId: req.body.trainerId,
          lessonTopic: req.body.lessonTopic,
          lessonDate: req.body.lessonDate,
          lessonTime: req.body.lessonTime,
          lessonDuration: req.body.lessonDuration,
          lessonDescription: req.body.lessonDescription,
          link: req.body.link,
          remarks: req.body.remarks,
          status: req.body.status
        }
      },
      { new: true }
    );

    res.status(200).json({
      lesson: updatedLesson,
      message: "Lesson planner updated successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
