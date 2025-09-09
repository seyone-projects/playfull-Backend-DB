const express = require("express");
const FeeScheme = require("../models/FeeScheme");

const router = express.Router();

// Get all subbatchs with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feeSchemes = await FeeScheme.find()
      .populate('batchId')
      .skip(skip)
      .limit(limit);

    const total = await FeeScheme.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      feeSchemes,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Fee Schemes retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching fee Schemes", error: err });
  }
});


// Get feeScheme by ID
router.get("/fsId/:id", async (req, res) => {
  try {
    const feeScheme = await FeeScheme.findById(req.params.id);
    if (!feeScheme) {
      res.status(400).json({ feeScheme: feeScheme, message: "Fee Scheme not found" });
    }
    else {
      res.status(200).json({ feeScheme: feeScheme, message: "Fee Scheme retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching sub batch", error: err });
  }
});


// Get feeSchemes by batch ID with pagination
router.get("/batchId/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feeSchemes = await FeeScheme.find({ batchId: req.params.id })
      .populate('batchId')
      .skip(skip)
      .limit(limit);

    const total = await FeeScheme.countDocuments({ batchId: req.params.id });
    const totalPages = Math.ceil(total / limit);

    if (!feeSchemes.length) {
      return res.status(404).json({ message: "No fee Schemes found for this batch" });
    }

    res.status(200).json({
      feeSchemes,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Fee Schemes retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching fee Schemes", error: err });
  }
});

module.exports = router;
