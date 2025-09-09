const express = require("express");
const SubCategory = require("../models/SubCategory");

const router = express.Router();

// Get all subcategorys with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subCategorys = await SubCategory.find()
      .populate('categoryId')
      .skip(skip)
      .limit(limit);

    const total = await SubCategory.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      subCategorys,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Sub categories retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching sub categories", error: err });
  }
});


// Get subCategory by ID
router.get("/scId/:id", async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      res.status(400).json({ subCategory: subCategory, message: "Sub category not found" });
    }
    else {
      res.status(200).json({ subCategory: subCategory, message: "Sub category retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching sub category", error: err });
  }
});


// Get subCategorys by category ID with pagination
router.get("/categoryId/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const subCategorys = await SubCategory.find({ categoryId: req.params.id })
      .populate('categoryId')
      .skip(skip)
      .limit(limit);

    const total = await SubCategory.countDocuments({ categoryId: req.params.id });
    const totalPages = Math.ceil(total / limit);

    if (!subCategorys.length) {
      return res.status(404).json({ message: "No sub categories found for this category" });
    }

    res.status(200).json({
      subCategorys,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Sub categories retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching sub categories", error: err });
  }
});

module.exports = router;
