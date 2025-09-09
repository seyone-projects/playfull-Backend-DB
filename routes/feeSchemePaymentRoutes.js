const express = require("express");
const FeeSchemePayment = require("../models/FeeSchemePayment");
const FeeScheme = require("../models/FeeScheme");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/feeSchemePayment"); // Folder where the image will be saved
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
    // Check if the given feeSchemeId exists
    const feeSchemeExists = await FeeScheme.findById(req.body.feeSchemeId);
    if (!feeSchemeExists) {
      return res.status(400).json({ feeSchemeExists: feeSchemeExists, message: "FeeScheme ID does not exist" });
    }

    // Check for existing fee scheme with same name in the feeScheme 
    const existingFeeSchemePaymentName = await FeeSchemePayment.findOne({
      feeSchemeId: req.body.feeSchemeId,
      name: req.body.name.trim()
    });

    // required name
    if (!req.body.name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check if due date is provided
    if (!req.body.dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    // required amount
    if (!req.body.amount) {
      return res.status(400).json({ message: "Amount is required" });
    }


    // Check for existing fee scheme
    if (existingFeeSchemePaymentName) {
      return res.status(400).json({
        existingFeeSchemePaymentName: existingFeeSchemePaymentName,
        message: `Fee Scheme Payment name "${req.body.name}" already exists in this feeScheme`
      });
    }

    // Check if amount is a positive number and greater than 0
    if (!req.body.amount || isNaN(req.body.amount) || parseFloat(req.body.amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number greater than 0"
      });
    }
    // Create new fee scheme
    const feeSchemePayment = new FeeSchemePayment({
      feeSchemeId: req.body.feeSchemeId,
      name: req.body.name,
      dueDate: req.body.dueDate,
      amount: req.body.amount,
      remarks: req.body.remarks,
      status: "active"
    });

    // Save fee scheme
    const savedFeeSchemePayment = await feeSchemePayment.save();

    res.status(200).json({ feeSchemePayment: savedFeeSchemePayment, message: "Fee Scheme Payment added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update fee scheme payment
router.post("/update/:id", upload.none(), async (req, res) => {
  try {
    // Check if fee scheme payment exists
    const existingFeeSchemePayment = await FeeSchemePayment.findById(req.params.id);
    if (!existingFeeSchemePayment) {
      return res.status(404).json({ message: "Fee Scheme Payment not found" });
    }

    // Check if the given feeSchemeId exists
    const feeSchemeExists = await FeeScheme.findById(req.body.feeSchemeId);
    if (!feeSchemeExists) {
      return res.status(400).json({ message: "FeeScheme ID does not exist" });
    }

    // Check for existing fee scheme with same name in the feeScheme (excluding current record)
    const existingFeeSchemePaymentName = await FeeSchemePayment.findOne({
      feeSchemeId: req.body.feeSchemeId,
      name: req.body.name.trim(),
      _id: { $ne: req.params.id }
    });

    if (existingFeeSchemePaymentName) {
      return res.status(400).json({
        message: `Fee Scheme Payment name "${req.body.name}" already exists in this feeScheme`
      });
    }


    // required name
    if (!req.body.name) {
      return res.status(400).json({ message: "Name is required" });
    }


    // Check if due date is provided
    if (!req.body.dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    // required amount
    if (!req.body.amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // Check if amount is a positive number and greater than 0
    if (!req.body.amount || isNaN(req.body.amount) || parseFloat(req.body.amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number greater than 0"
      });
    }
    
    // Update fee scheme payment
    const updatedFeeSchemePayment = await FeeSchemePayment.findByIdAndUpdate(
      req.params.id,
      {
        feeSchemeId: req.body.feeSchemeId,
        name: req.body.name,
        dueDate: req.body.dueDate,
        amount: req.body.amount,
        remarks: req.body.remarks,
        status: req.body.status
      },
      { new: true }
    );

    res.status(200).json({
      feeScheme: updatedFeeSchemePayment,
      message: "Fee Scheme Payment updated successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete fee scheme payment
router.delete("/delete/:id", async (req, res) => {
  try {
    // Check if fee scheme payment exists
    const existingFeeSchemePayment = await FeeSchemePayment.findById(req.params.id);
    if (!existingFeeSchemePayment) {
      return res.status(404).json({ message: "Fee Scheme Payment not found" });
    }

    // Delete fee scheme payment
    await FeeSchemePayment.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Fee Scheme Payment deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
