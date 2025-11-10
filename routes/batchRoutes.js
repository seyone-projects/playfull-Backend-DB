const express = require("express");
const mongoose = require("mongoose");
const Batch = require("../models/Batch");
const User = require("../models/User");
const Course = require("../models/Course");
const FeeScheme = require("../models/FeeScheme");
const { sendHtmlEmail } = require("./mailRoutes");

const app = express();
app.use(express.json());

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/batches"); // Folder where the image will be saved
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

// Add Batch
/** 
router.post("/add", upload.single("image"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check for required fields
    const requiredFields = ['code', 'name', 'description', 'startDate', 'fee', 'certificate', 'trainerId'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    // Extract the extension (e.g., .jpg, .png) and remove the dot (.)
    const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

    // Validate file extension
    if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
      return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
    }

    // Check if the given userId exists
    const userExists = await User.findById(req.body.trainerId);
    if (!userExists) {
      return res.status(400).json({ userExists: userExists, message: "User ID does not exist" });
    }

    // Check if batch code is unique
    const existingBatch = await Batch.findOne({ code: req.body.code });
    if (existingBatch) {
      return res.status(400).json({ message: "Batch code already exists" });
    }
    //const users = JSON.parse(req.body.users);
    // Parse users if it's a string
    let users;
    try {
      users = typeof req.body.users === 'string'
        ? JSON.parse(req.body.users)
        : req.body.users;

      if (!Array.isArray(users)) {
        return res.status(400).json({
          message: "users must be an array",
          received: typeof users,
          value: users
        });
      }
    } catch (err) {
      return res.status(400).json({
        message: "Error parsing users",
        error: err.message
      });
    }

    // Fetch full user details from DB
    const populatedUsers = await Promise.all(
      users.map(async (user) => {
        const pv = await User.findById(user.userId);
        if (!pv) {
          throw new Error(`User with ID ${user.userId} not found`);
        }

        return {
          userId: pv._id,
          joiningDate: user.joiningDate,
        };
      })
    );

    // Store the batch details
    const batch = new Batch({
      trainerId: req.body.trainerId,
      code: req.body.code,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate,
      fee: req.body.fee,
      certificate: req.body.certificate,
      image: fileExtension,
      users: populatedUsers,
      status: "active",
    });

    // Save batch to get ID
    const savedBatch = await batch.save();

    // Rename uploaded file to batch ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/batches/", savedBatch._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ batch: savedBatch, message: "Batch added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});*/

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check for required fields
    const requiredFields = ['code', 'name', 'description', 'startDate', 'fee', 'certificate', 'trainerId', 'courseId', 'trainerCost', 'trainerTds'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Check if fee is negative
    if (parseFloat(req.body.fee) < 0) {
      return res.status(400).json({ message: "Fee cannot be negative" });
    }

      // Check if trainerCost is negative
    if (parseFloat(req.body.trainerCost) < 0) {
      return res.status(400).json({ message: "Trainer cost cannot be negative" });
    }

    // Check if trainerTds is negative
    if (parseFloat(req.body.trainerTds) < 0) {
      return res.status(400).json({ message: "Trainer TDS cannot be negative" });
    }

    // Extract the extension (e.g., .jpg, .png) and remove the dot (.)
    const fileExtension = path.extname(req.file.originalname).slice(1);

    // Validate file extension
    const validExtensions = ['jpg', 'png', 'JPG', 'PNG'];
    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({
        fileExtension: fileExtension,
        message: "Only .jpg, .JPG, .PNG and .png files are allowed"
      });
    }

    // Check if the trainer (user) exists
    const userExists = await User.findById(req.body.trainerId);
    if (!userExists) {
      return res.status(400).json({ message: "Trainer ID does not exist" });
    }

    // Ensure batch code is unique
    const existingBatch = await Batch.findOne({ code: req.body.code });
    if (existingBatch) {
      return res.status(400).json({ message: "Batch code already exists" });
    }

    //check if courseId exists
    const courseExists = await Course.findById(req.body.courseId);
    if (!courseExists) {
      return res.status(400).json({ message: "Course ID does not exist" });
    }


    // Check if trainer is already mapped to this course
    const existingBatchWithCourse = await Batch.findOne({
      trainerId: req.body.trainerId,
      courseId: req.body.courseId,
      status: "active"
    });

    if (existingBatchWithCourse) {
      return res.status(400).json({
        message: "This trainer is already mapped to this course in another active batch"
      });
    }

    // Create new batch (no users array)
    const batch = new Batch({
      trainerId: req.body.trainerId,
      code: req.body.code,
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate,
      fee: req.body.fee,
      certificate: req.body.certificate,
      image: fileExtension,
      status: "active",
      courseId: req.body.courseId,
      trainerCost: req.body.trainerCost,
      trainerTds: req.body.trainerTds,
    });

    const savedBatch = await batch.save();

    // Rename the uploaded file
    const oldPath = req.file.path;
    const newPath = path.join("uploads/batches/", savedBatch._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ batch: savedBatch, message: "Batch added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update Batch
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    // Check for required fields
    const requiredFields = ['code', 'name', 'description', 'startDate', 'fee', 'certificate', 'trainerId'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Check if batch exists
    const existingBatch = await Batch.findById(req.params.id);
    if (!existingBatch) {
      return res.status(400).json({ message: "Batch not found" });
    }

    // Check if trainer exists if trainerId is being updated
    if (req.body.trainerId) {
      const trainerExists = await User.findById(req.body.trainerId);
      if (!trainerExists) {
        return res.status(400).json({ message: "Trainer ID does not exist" });
      }
    }

    // Check if fee is negative
    if (req.body.fee && parseFloat(req.body.fee) < 0) {
      return res.status(400).json({ message: "Fee cannot be negative" });
    }

    // Check if trainerCost is negative
    if (req.body.trainerCost && parseFloat(req.body.trainerCost) < 0) {
      return res.status(400).json({ message: "Trainer cost cannot be negative" });
    }

    // Check if trainerTds is negative
    if (req.body.trainerTds && parseFloat(req.body.trainerTds) < 0) {
      return res.status(400).json({ message: "Trainer TDS cannot be negative" });
    }

    // Check if batch code is unique if code is being updated
    if (req.body.code) {
      const batchWithCode = await Batch.findOne({
        code: req.body.code,
        _id: { $ne: req.params.id }
      });
      if (batchWithCode) {
        return res.status(400).json({ message: "Batch code already exists" });
      }
    }

    // Check if courseId exists if courseId is being updated
    if (req.body.courseId) {
      const courseExists = await Course.findById(req.body.courseId);
      if (!courseExists) {
        return res.status(400).json({ message: "Course ID does not exist" });
      }

      // Check if trainer is already mapped to this course in another active batch
      const existingBatchWithCourse = await Batch.findOne({
        trainerId: req.body.trainerId || existingBatch.trainerId,
        courseId: req.body.courseId,
        _id: { $ne: req.params.id },
        status: "active"
      });

      if (existingBatchWithCourse) {
        return res.status(400).json({
          message: "This trainer is already mapped to this course in another active batch"
        });
      }
    }

    // Handle users array if it's being updated
    let updatedUsers;
    if (req.body.users) {
      try {
        const users = typeof req.body.users === 'string'
          ? JSON.parse(req.body.users)
          : req.body.users;

        if (!Array.isArray(users)) {
          return res.status(400).json({
            message: "users must be an array",
            received: typeof users,
            value: users
          });
        }

        updatedUsers = await Promise.all(
          users.map(async (user) => {
            const pv = await User.findById(user.userId);
            if (!pv) {
              throw new Error(`User with ID ${user.userId} not found`);
            }
            return {
              userId: pv._id,
              joiningDate: user.joiningDate,
            };
          })
        );
      } catch (err) {
        return res.status(400).json({
          message: "Error processing users",
          error: err.message
        });
      }
    }

    // Handle image upload if new image is provided
    let imageExtension = existingBatch.image;
    if (req.file) {
      imageExtension = path.extname(req.file.originalname).slice(1);

      if (imageExtension !== 'jpg' && imageExtension !== 'png' && imageExtension !== 'JPG' && imageExtension !== 'PNG') {
        return res.status(400).json({ message: "Only .jpg, .JPG, .PNG and .png files are allowed" });
      }

      // Rename and move new image
      const newPath = path.join("uploads/batches/", req.params.id + "." + imageExtension);
      require('fs').rename(req.file.path, newPath, (err) => {
        if (err) throw err;
      });
    }

    // Update batch
    const updateData = {
      ...(req.body.trainerId && { trainerId: req.body.trainerId }),
      ...(req.body.code && { code: req.body.code }),
      ...(req.body.name && { name: req.body.name }),
      ...(req.body.description && { description: req.body.description }),
      ...(req.body.startDate && { startDate: req.body.startDate }),
      ...(req.body.fee && { fee: req.body.fee }),
      ...(req.body.certificate && { certificate: req.body.certificate }),
      ...(req.body.status && { status: req.body.status }),
      ...(req.file && { image: imageExtension }),
      ...(updatedUsers && { users: updatedUsers }),
      ...(req.body.courseId && { courseId: req.body.courseId }),
      ...(req.body.trainerCost && { trainerCost: req.body.trainerCost }),  
      ...(req.body.trainerTds && { trainerTds: req.body.trainerTds }) 
    };

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      batch: updatedBatch,
      message: "Batch updated successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//update users by batch id
router.post("/updateUsers/:id", upload.none(), async (req, res) => {
  try {
    const existingBatch = await Batch.findById(req.params.id)

      .populate("courseId")   // assuming batch has a reference to course
      .populate("trainerId"); // assuming batch has a reference to trainer

    if (!existingBatch) {
      return res.status(400).json({ message: "Batch not found" });
    }

    if (!req.body.users) {
      return res.status(400).json({ message: "Students is required" });
    }

    let users;
    try {
      users = typeof req.body.users === 'string'
        ? JSON.parse(req.body.users)
        : req.body.users;

      if (!Array.isArray(users)) {
        return res.status(400).json({
          message: "students must be an array",
          received: typeof users,
          value: users
        });
      }
    } catch (err) {
      return res.status(400).json({
        message: "Error parsing students",
        error: err.message
      });
    }

    // Get list of already mapped userIds in the batch
    const existingUserIds = existingBatch.users.map(u => u.userId.toString());

    // Filter out users who are already mapped
    const newUsersToAdd = users.filter(user => !existingUserIds.includes(user.userId));

    // Populate only the new users
    const populatedNewUsers = await Promise.all(
      newUsersToAdd.map(async (user) => {
        const pv = await User.findById(user.userId);
        if (!pv) {
          throw new Error(`Student with ID ${user.userId} not found`);
        }
        return {
          userId: pv._id,
          joiningDate: user.joiningDate,
        };
      })
    );

    // Combine existing users with new users
    const updatedUsersList = [...existingBatch.users, ...populatedNewUsers];

    const updatedBatch = await Batch.findByIdAndUpdate(
      req.params.id,
      { users: updatedUsersList },
      { new: true }
    );

    // Email integration (send to all batch students)
    const allUserIds = updatedUsersList.map(u => u.userId);
    const allStudents = await User.find({ _id: { $in: allUserIds } });

    // Format start date
    const formattedStartDate = new Date(existingBatch.startDate)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

      
    // Prepare email content 
    const subject = `📢 Your Batch Details – ${ existingBatch.courseId.name } at Playful Pencil`;
    const trainerName = existingBatch.trainerId ? existingBatch.trainerId?.username : "Trainer";

    for (const student of allStudents) {
      const htmlContent = `
        <h3>Dear ${student.username},</h3>
<p>We are excited to inform you about the details of your upcoming batch at <b>Playful Pencil</b> 🎉. Please find your schedule and trainer details below:</p>

<ul>
  <li>🆔 <b>Batch Name:</b> ${existingBatch.name}</li>
  <li>👨🏫 <b>Trainer:</b> ${trainerName}</li>
  <li>📅 <b>Start Date:</b> ${formattedStartDate}</li>  
  <li>📍 <b>Mode:</b> [Online]</li>
</ul>

<p>👉 Please make sure to be available for your first session on <b>${formattedStartDate}</b>.</p>

<p>If you have any questions or require assistance, feel free to contact us at <b>[support@seyone.co / 9043062245]</b>.</p>

<p>We’re looking forward to seeing you in class and supporting your learning journey 🚀</p>

<p>Best regards,<br/>Playful Pencil Team</p>

      `;

      await sendHtmlEmail(student.email, subject, htmlContent);
    }  
    
    res.status(200).json({
      batch: updatedBatch,
      message: `Batch students updated successfully.`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete batch student by batch id
router.delete("/deleteUser/:batchId/:userId", async (req, res) => {
  try {
    const { batchId, userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Student is required" });
    }

    // Use $pull to remove the user by userId
    const result = await Batch.findByIdAndUpdate(
      batchId,
      { $pull: { users: { userId: userId } } },
      { new: true } // Return updated batch
    );

    if (!result) {
      return res.status(400).json({ message: "Batch not found" });
    }

    res.status(200).json({
      batch: result,
      message: "Student removed from batch successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
