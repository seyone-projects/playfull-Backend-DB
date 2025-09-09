const express = require("express");
const Category = require("../models/Category");

const router = express.Router();


// Get categories with pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of categories
    const total = await Category.countDocuments();

    // Get paginated categories
    const categories = await Category.find()
     .populate("sectionId")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      categories,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      message: "Categories retrieved successfully"
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", error: err });
  }
});

// Get Category by ID
router.get("/cId/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(400).json({ category: category, message: "Category not found" });
    }
    else {
      res.status(200).json({ category: category, message: "Category retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching category", error: err });
  }
});

module.exports = router;
