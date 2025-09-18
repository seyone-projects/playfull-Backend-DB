const express = require("express");
const Batch = require("../models/Batch");
const User = require("../models/User");
const FeeScheme = require("../models/FeeScheme");
const FeeSchemePayment = require("../models/FeeSchemePayment");
const BatchStudent = require("../models/BatchStudent");
const BatchStudentPayment = require("../models/BatchStudentPayment");
const mongoose = require("mongoose");
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
    cb(null, "uploads/batchstudent"); // Folder where the image will be saved
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


//add batch student
/** 
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

    const feeSchemeExists = await FeeScheme.findById(req.body.feeSchemeId);
    if (!feeSchemeExists) {
      return res.status(400).json({ message: "Fee Scheme ID does not exist" });
    }

    // Create new batchStudent  entry
    const batchStudent = new BatchStudent({
      batchId: req.body.batchId,
      userId: req.body.userId,
      feeSchemeId: req.body.feeSchemeId,
      status: "active"
    });

    // Save batchStudent 
    const savedBatchStudent = await batchStudent.save();  
    
    res.status(200).json({
      batchStudent: savedBatchStudent,
      message: "Batch Student added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
*/

router.post("/add", upload.none(), async (req, res) => {
  try {
    const { userIds, batchId, feeSchemeId } = req.body; // note: userIds is an array

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }

    // Validate Batch
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }
    const batchExists = await Batch.findById(batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch ID does not exist" });
    }

    let feePayments = [];
    if (batchExists.fee > 0) {
      // Only validate FeeSchemeId when batch fee > 0
      if (!mongoose.Types.ObjectId.isValid(feeSchemeId)) {
        return res.status(400).json({ message: "Invalid Fee Scheme ID format" });
      }
      const feeScheme = await FeeScheme.findById(feeSchemeId);
      if (!feeScheme) {
        return res.status(400).json({ message: "Fee Scheme ID does not exist" });
      }
      // Get all FeeSchemePayments once
      feePayments = await FeeSchemePayment.find({ feeSchemeId });
    }

    const addedStudents = [];
    const skippedStudents = [];

    for (let userId of userIds) {
      // Validate User
      const userExists = await User.findById(userId);
      if (!userExists) {
        continue; // skip invalid users
      }

      // Check if already exists in this batch
      const alreadyExists = await BatchStudent.findOne({ batchId, userId });
      if (alreadyExists) {
        skippedStudents.push(userId); // keep track of skipped students
        continue; // skip duplicate
      }

      // Create BatchStudent
      const batchStudent = new BatchStudent({
        batchId,
        userId,
        feeSchemeId,
        status: "active"
      });
      const savedBatchStudent = await batchStudent.save();

      // Create BatchStudentPayments for this student
      for (let payment of feePayments) {
        const batchStudentPayment = new BatchStudentPayment({
          batchStudentId: savedBatchStudent._id,
          amount: payment.amount,
          lastDate: payment.dueDate,
          paymentReference: null,
          paymentDateTime: null,
          status: "active"
        });
        await batchStudentPayment.save();
      }

      addedStudents.push(savedBatchStudent);
    }

    res.status(200).json({
      batchStudents: addedStudents,
      skipped: skippedStudents,
      message:
        skippedStudents.length > 0
          ? "Some students were already mapped and skipped"
          : "Selected students added successfully with fee payments"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//batch students by batch ID with pagination
router.get("/batchId/:batchId", async (req, res) => {
  try {
    const batchId = req.params.batchId;

    // Validate batch ID format
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of batch students
    const totalCount = await BatchStudent.countDocuments({ batchId: batchId });

    // Find batch students with pagination
    const batchStudents = await BatchStudent.find({ batchId: batchId })
      .populate('userId')
      .populate('feeSchemeId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      batchStudents,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


//get batch students by batchid, studentid from batch student payments with pagination
router.get("/payments/:batchId/:studentId", async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find batch student
    const batchStudent = await BatchStudent.findOne({
      batchId: batchId,
      userId: studentId
    });

    if (!batchStudent) {
      return res.status(404).json({ message: "Batch student not found" });
    }

    // Get total count of payments
    const totalCount = await BatchStudentPayment.countDocuments({
      batchStudentId: batchStudent._id
    });

    // Get paginated payments
    const payments = await BatchStudentPayment.find({
      batchStudentId: batchStudent._id
    })
    .skip(skip)
    .limit(limit)
    .sort({ lastDate: 1 });

    res.status(200).json({
      payments,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete student by batch ID
router.delete("/delete/:batchId/:studentId", async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ message: "Invalid batch ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" }); 
    }

    // Find batch student
    const batchStudent = await BatchStudent.findOne({
      batchId: batchId,
      userId: studentId
    });

    if (!batchStudent) {
      return res.status(404).json({ message: "Batch student not found" });
    }

    // Delete associated payments first
    await BatchStudentPayment.deleteMany({
      batchStudentId: batchStudent._id
    });

    // Delete the batch student
    await BatchStudent.findByIdAndDelete(batchStudent._id);

    res.status(200).json({
      message: "Student removed successfully from batch"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/batches/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of mapped batches for student
    const totalCount = await BatchStudent.countDocuments({ userId: studentId });

    // Find all batches mapped to student with pagination
    const mappedBatches = await BatchStudent.find({ userId: studentId })
      .populate('batchId')
      .populate('feeSchemeId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      mappedBatches,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
