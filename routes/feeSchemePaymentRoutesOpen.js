const express = require("express");
const mongoose = require("mongoose");
const FeeSchemePayment = require("../models/FeeSchemePayment");

const router = express.Router();

// Get all subfeeSchemes with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feeSchemePayments = await FeeSchemePayment.find()
      .populate('feeSchemeId')
      .skip(skip)
      .limit(limit);

    const total = await FeeSchemePayment.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      feeSchemePayments,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Fee Scheme payments retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching fee Scheme payments", error: err });
  }
});


// Get feeSchemePayment by ID
router.get("/fspId/:id", async (req, res) => {
  try {
    const feeSchemePayment = await FeeSchemePayment.findById(req.params.id)
      .populate('feeSchemeId');

    if (!feeSchemePayment) {
      return res.status(404).json({ message: "Fee Scheme payment not found" });
    }

    res.status(200).json({
      feeSchemePayment,
      message: "Fee Scheme payment retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching fee Scheme payment", error: err });
  }
});


// Get feeSchemePayments by feeScheme ID with pagination and total amount
router.get("/feeSchemeId/:feeSchemeId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feeSchemePayments = await FeeSchemePayment.find({ feeSchemeId: req.params.feeSchemeId })
      .populate('feeSchemeId')
      .skip(skip)
      .limit(limit);

    const total = await FeeSchemePayment.countDocuments({ feeSchemeId: req.params.feeSchemeId });
    const totalPages = Math.ceil(total / limit);

    // Calculate total amount (cast feeSchemeId as ObjectId)
    const totalAmount = await FeeSchemePayment.aggregate([
      { $match: { feeSchemeId: new mongoose.Types.ObjectId(req.params.feeSchemeId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      feeSchemePayments,
      currentPage: page,
      totalPages,
      totalItems: total,
      totalAmount: totalAmount[0]?.total || 0,      
      message: "Fee Scheme payments retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching fee Scheme payments", error: err });
  }
});


module.exports = router;
