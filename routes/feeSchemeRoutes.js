const express = require("express");
const FeeScheme = require("../models/FeeScheme");
const Batch = require("../models/Batch");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/feeScheme"); // Folder where the image will be saved
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


//add free scheme without image
router.post("/add", upload.none(), async (req, res) => {
  try {
    // Check if the given batchId exists
    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ batchExists: batchExists, message: "Batch ID does not exist" });
    }

    // Check for existing fee scheme with same name in the batch 
    const existingFeeSchemeName = await FeeScheme.findOne({
      batchId: req.body.batchId,
      name: req.body.name.trim()
    });

    // Check for existing fee scheme
    if (existingFeeSchemeName) {
      return res.status(400).json({
        existingFeeSchemeName: existingFeeSchemeName,
        message: `Fee Scheme name "${req.body.name}" already exists in this batch`
      });
    }

    // Check if name is provided
    if (!req.body.name) {
      return res.status(400).json({ message: "Fee Scheme name is required" });
    }

    // Create new fee scheme
    const batch = new FeeScheme({
      batchId: req.body.batchId,
      name: req.body.name,
      remarks: req.body.remarks,
      status: "active"
    });

    // Save fee scheme
    const savedFeeScheme = await batch.save();

    res.status(200).json({ batch: savedFeeScheme, message: "Fee Scheme added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update fee scheme
router.post("/update/:id", upload.none(), async (req, res) => {
  try {
    // Check if fee scheme exists
    const feeScheme = await FeeScheme.findById(req.params.id);
    if (!feeScheme) {
      return res.status(400).json({ message: "Fee Scheme not found" });
    }

    // Check if batch exists
    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ message: "Batch ID does not exist" });
    }

    // Check for existing fee scheme with same name in the batch (excluding current scheme)
    const existingFeeSchemeName = await FeeScheme.findOne({
      _id: { $ne: req.params.id },
      batchId: req.body.batchId,
      name: req.body.name.trim()
    });

    if (existingFeeSchemeName) {
      return res.status(400).json({
        message: `Fee Scheme name "${req.body.name}" already exists in this batch`
      });
    }

    //required name
    if (!req.body.name) {
      return res.status(400).json({ message: "Fee Scheme name is required" });
    } 

    // Update fee scheme
    const updatedFeeScheme = await FeeScheme.findByIdAndUpdate(
      req.params.id,
      {
        batchId: req.body.batchId,
        name: req.body.name,
        remarks: req.body.remarks,
        status: req.body.status
      },
      { new: true }
    );

    res.status(200).json({
      feeScheme: updatedFeeScheme,
      message: "Fee Scheme updated successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fee scheme
router.delete("/delete/:id", async (req, res) => {
  try {
    // Check if fee scheme exists
    const feeScheme = await FeeScheme.findById(req.params.id);
    if (!feeScheme) {
      return res.status(400).json({ message: "Fee Scheme not found" });
    }

    // Delete the fee scheme
    await FeeScheme.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Fee Scheme deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
