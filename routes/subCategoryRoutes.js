const express = require("express");
const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/subCategorys"); // Folder where the image will be saved
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

// Add subCategory with image and rename file to subCategory ID
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract file extension without dot
    const fileExtension = path.extname(req.file.originalname).slice(1);

    // Validate file extension
    if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
      return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
    }

    // Check if the given categoryId exists
    const categoryExists = await Category.findById(req.body.categoryId);  // Assuming you have a Category model to check against
    if (!categoryExists) {
      return res.status(400).json({ categoryExists: categoryExists, message: "Category ID does not exist" });
    }

    // Check for existing sub-category with same name in the category
    const existingSubCategoryName = await SubCategory.findOne({
      categoryId: req.body.categoryId,
      name: req.body.name.trim() // Trim whitespace to avoid duplicate entries
    });

    // Check for existing sub-category
    if (existingSubCategoryName) {
      return res.status(400).json({
        existingSubCategoryName: existingSubCategoryName,
        message: `Sub category name "${req.body.name}" already exists in this category`
      });
    }

    // Create new sub-category
    const subCategory = new SubCategory({
      categoryId: req.body.categoryId, // Add categoryId to the subCategory
      name: req.body.name,
      image: fileExtension,
      status: "active"
    });

    // Save sub-category to get ID
    const savedSubCategory = await subCategory.save();

    // Rename uploaded file to sub-category ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/subCategorys/", savedSubCategory._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ subCategory: savedSubCategory, message: "Sub category added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update subCategory with image and rename file to subCategory ID
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { categoryId, name, image, status } = req.body;

    // Check if the given categoryId exists
    const categoryExists = await Category.findById(categoryId); // Check if categoryId exists in the Category collection
    if (!categoryExists) {
      return res.status(400).json({ categoryExists: categoryExists, message: "Category ID does not exist" });
    }

    // Check if the sub-category name is already in use (excluding the current category being updated)
    const existingSubCategoryName = await SubCategory.findOne({
      name: req.body.name.trim(), // Trim whitespace to avoid duplicate entries
      _id: { $ne: req.params.id }, // Exclude the current sub-category from check
      categoryId: req.body.categoryId // Ensure validation is category-specific
    });

    if (existingSubCategoryName) {
      return res.status(400).json({
        existingSubCategoryName: existingSubCategoryName,
        message: `Sub-category name "${req.body.name}" already exists in this category`
      });
    }

    const updatedData = {
      categoryId,
      name,
      image,
      status,
    };

    // Check if there's a new image uploaded
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

      // Check if the file is either .jpg or .png
      if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
        return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
      }

      updatedData.image = fileExtension;  // Save only the extension (without dot) in MongoDB

      // Rename uploaded file to sub-category ID
      const oldPath = req.file.path;
      const newPath = path.join("uploads/subCategorys/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedSubCategory) {
      res.status(400).json({ updatedSubCategory: updatedSubCategory, message: "Sub category not found" });
    }
    else {
      res.status(200).json({ updatedSubCategory: updatedSubCategory, message: "Sub category updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating sub category", error: err });
  }
});


// Delete subCategory
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleteSubCategory = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleteSubCategory) {
      res.status(400).json({ deleteSubCategory: deleteSubCategory, message: "Sub category not found" });
    }
    else {
      res.status(200).json({ deleteSubCategory: deleteSubCategory, message: "Sub category deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting sub category", error: err });
  }
});

module.exports = router;
