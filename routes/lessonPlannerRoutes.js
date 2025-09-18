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
const fs = require('fs');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "screenshot1") {
      cb(null, "uploads/screenshot1/");
    } else if (file.fieldname === "screenshot2") {
      cb(null, "uploads/screenshot2/");
    } else if (file.fieldname === "screenshot3") {
      cb(null, "uploads/screenshot3/");
    } else if (file.fieldname === "screenshot4") {
      cb(null, "uploads/screenshot4/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// 👉 For /add (multiple fields)
const uploadMulti = multer({ storage }).fields([
  { name: "screenshot1", maxCount: 1 },
  { name: "screenshot2", maxCount: 1 },
  { name: "screenshot3", maxCount: 1 },
  { name: "screenshot4", maxCount: 1 },
]);

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

router.post("/update/:id", uploadMulti, async (req, res) => {
  try {
    const lessonId = req.params.id;

    const screenshot1 = req.files.screenshot1 ? path.extname(req.files.screenshot1[0].originalname).slice(1) : null;
    const screenshot2 = req.files.screenshot2 ? path.extname(req.files.screenshot2[0].originalname).slice(1) : null;
    const screenshot3 = req.files.screenshot3 ? path.extname(req.files.screenshot3[0].originalname).slice(1) : null;
    const screenshot4 = req.files.screenshot4 ? path.extname(req.files.screenshot4[0].originalname).slice(1) : null;

    const allowedExtensions = ['pdf', 'docx', 'png', 'jpg', 'jpeg'];

    if (screenshot1 && !allowedExtensions.includes(screenshot1.toLowerCase())) {
      return res.status(400).json({ message: "Screenshot 1 must be pdf, docx, png, jpg or jpeg" });
    }
    if (screenshot2 && !allowedExtensions.includes(screenshot2.toLowerCase())) {
      return res.status(400).json({ message: "Screenshot 2 must be pdf, docx, png, jpg or jpeg" });
    }
    if (screenshot3 && !allowedExtensions.includes(screenshot3.toLowerCase())) {
      return res.status(400).json({ message: "Screenshot 3 must be pdf, docx, png, jpg or jpeg" });
    }
    if (screenshot4 && !allowedExtensions.includes(screenshot4.toLowerCase())) {
      return res.status(400).json({ message: "Screenshot 4 must be pdf, docx, png, jpg or jpeg" });
    }

    const lessonExists = await LessonPlanner.findById(lessonId);
    if (!lessonExists) return res.status(404).json({ message: "Lesson planner not found" });

    if (req.body.trainerId) {
      const trainerExists = await User.findById(req.body.trainerId);
      if (!trainerExists) return res.status(400).json({ message: "Trainer ID does not exist" });
    }

    if (req.body.batchId) {
      const batchExists = await Batch.findById(req.body.batchId);
      if (!batchExists) return res.status(400).json({ message: "Batch ID does not exist" });
    }

    if (req.body.lessonTopic === "") return res.status(400).json({ message: "Lesson topic cannot be empty" });
    if (req.body.lessonDate === "") return res.status(400).json({ message: "Lesson date cannot be empty" });
    if (req.body.lessonTime === "") return res.status(400).json({ message: "Lesson time cannot be empty" });
    if (req.body.lessonDuration && req.body.lessonDuration <= 0) return res.status(400).json({ message: "Lesson duration must be greater than 0" });
    if (req.body.lessonDescription === "") return res.status(400).json({ message: "Lesson description cannot be empty" });
    if (req.body.link === "") return res.status(400).json({ message: "Link cannot be empty" });

    // Build update object dynamically
    const updateData = {
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
    };

    if (screenshot1) updateData.screenshot1 = screenshot1;
    if (screenshot2) updateData.screenshot2 = screenshot2;
    if (screenshot3) updateData.screenshot3 = screenshot3;
    if (screenshot4) updateData.screenshot4 = screenshot4;

    const updatedLesson = await LessonPlanner.findByIdAndUpdate(
      lessonId,
      { $set: updateData },
      { new: true }
    );

    // Rename uploaded screenshots
    if (req.files.screenshot1) {
      const newScreenshot1 = path.join("uploads/screenshot1/", updatedLesson._id + "." + screenshot1);
      if (fs.existsSync(newScreenshot1)) fs.unlinkSync(newScreenshot1);
      fs.renameSync(req.files.screenshot1[0].path, newScreenshot1);
    }
    if (req.files.screenshot2) {
      const newScreenshot2 = path.join("uploads/screenshot2/", updatedLesson._id + "." + screenshot2);
      if (fs.existsSync(newScreenshot2)) fs.unlinkSync(newScreenshot2);
      fs.renameSync(req.files.screenshot2[0].path, newScreenshot2);
    }
    if (req.files.screenshot3) {
      const newScreenshot3 = path.join("uploads/screenshot3/", updatedLesson._id + "." + screenshot3);
      if (fs.existsSync(newScreenshot3)) fs.unlinkSync(newScreenshot3);
      fs.renameSync(req.files.screenshot3[0].path, newScreenshot3);
    }
    if (req.files.screenshot4) {
      const newScreenshot4 = path.join("uploads/screenshot4/", updatedLesson._id + "." + screenshot4);
      if (fs.existsSync(newScreenshot4)) fs.unlinkSync(newScreenshot4);
      fs.renameSync(req.files.screenshot4[0].path, newScreenshot4);
    }

    res.status(200).json({
      lesson: updatedLesson,
      message: "Lesson planner updated successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
