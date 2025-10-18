const express = require("express");
const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const mongoose = require("mongoose");

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


// Search subcategories with text (min 3 chars) and sectionId
router.get("/search", async (req, res) => {
  try {
    const { searchText, sectionId } = req.query;

    // Validate inputs
    if (!searchText || searchText.length < 3) {
      return res.status(400).json({ message: "Search text must be at least 3 characters long" });
    }
    if (!sectionId || !mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: "Valid Section ID is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Step 1: Get all categories in this section
    const categories = await Category.find({ sectionId: sectionId }, "_id");
    const categoryIds = categories.map(cat => cat._id);

    if (!categoryIds.length) {
      return res.status(404).json({ message: "No categories found for this section" });
    }

    // Step 2: Get subcategories in these categories matching the search text
    const searchQuery = {
      name: { $regex: searchText, $options: "i" },
      categoryId: { $in: categoryIds }
    };

    const subCategories = await SubCategory.find(searchQuery)
      .populate({ path: "categoryId", select: "name section" }) // optional: include category info
      .skip(skip)
      .limit(limit);

    const total = await SubCategory.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    if (!subCategories.length) {
      return res.status(404).json({ message: "No subcategories found matching the search criteria" });
    }

    res.status(200).json({
      subCategories,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Subcategories retrieved successfully"
    });

  } catch (err) {
    res.status(500).json({ message: "Error searching subcategories", error: err.message });
  }
});


module.exports = router;
