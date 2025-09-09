const express = require("express");
const Payment = require("../models/Payment");
const Paymode = require("../models/Paymode");
const User = require("../models/User");
const Batch = require("../models/Batch");
const mongoose = require("mongoose");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/payments"); // Folder where the image will be saved
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

// Add payment with image and rename file to payment ID
router.post("/add", upload.none(), async (req, res) => {
  try {
    // Check if the given paymodeId exists
    const paymodeExists = await Paymode.findById(req.body.paymodeId); // Assuming you have a paymode model to check against
    if (!paymodeExists) {
      return res.status(400).json({ paymodeExists: paymodeExists, message: "Paymode ID does not exist" });
    }

    // Check if the given userId exists
    const userExists = await User.findById(req.body.userId);
    if (!userExists) {
      return res.status(400).json({ userExists: userExists, message: "User ID does not exist" });
    }

    // Check if the given batchId exists
    const batchExists = await Batch.findById(req.body.batchId);
    if (!batchExists) {
      return res.status(400).json({ batchExists: batchExists, message: "Batch ID does not exist" });
    }

    // Check if payment date is provided
    if (!req.body.paymentDateTime) {
      return res.status(400).json({ message: "Payment date is required" });
    }

    // Check if amount is greater than 0
    if (!req.body.amount || req.body.amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    // Check if paymode is provided
    if (!req.body.paymodeId) {
      return res.status(400).json({ message: "Payment mode is required" });
    }

    // Get batch fee amount
    const batchFee = batchExists.fee;

    // Calculate total paid amount for this user and batch
    const previousPayments = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.body.userId),
          batchId: new mongoose.Types.ObjectId(req.body.batchId)
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" }
        }
      }
    ]);

    const alreadyPaid = previousPayments.length > 0 ? previousPayments[0].totalPaid : 0;
    const newAmount = Number(req.body.amount);

    if (alreadyPaid + newAmount > batchFee) {
      return res.status(400).json({ message: "Amount paid should not exceed the fee amount" });
    }

    // Store the extension (set as empty since no image is uploaded)
    const payment = new Payment({
      paymodeId: req.body.paymodeId,
      userId: req.body.userId,
      batchId: req.body.batchId,
      amount: req.body.amount,
      paymentDateTime: req.body.paymentDateTime,
      paymentReference: req.body.paymentReference,
      reason: req.body.reason,
      status: "active",
    });

    // Save payment to get ID
    const savedPayment = await payment.save();

    // Calculate total payments for the batch
    const totalPayments = await Payment.aggregate([
      { $match: { batchId: req.body.batchId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Calculate total amount paid including current payment
    const amountPaid = Number(req.body.amount);


    // Calculate total paid amount for this user and batch
    const totalPaidAmount = alreadyPaid + amountPaid;

    // Calculate remaining balance
    const balance = batchFee - totalPaidAmount;

    // Add payment amounts to response
    res.status(200).json({
      payment: savedPayment,
      amountPaid: amountPaid,
      totalPaidAmount: totalPaidAmount,
      balance: balance,
      total: batchFee,
      message: "Payment added successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Delete Payment
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletePayment = await Payment.findByIdAndDelete(req.params.id);
    if (!deletePayment) {
      res.status(400).json({ deletePayment: deletePayment, message: "Payment not found" });
    }
    else {
      res.status(200).json({ deletePayment: deletePayment, message: "Payment deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting payment", error: err });
  }
});

module.exports = router;
