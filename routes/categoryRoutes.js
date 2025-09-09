const express = require("express");
const Category = require("../models/Category");
const Section = require("../models/Section");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/categorys"); // Folder where the image will be saved
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

// Add category with image and rename file to category ID
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract the extension (e.g., .jpg, .png) and remove the dot (.)
    const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

    // Validate file extension
    if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
      return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
    }

    // Check if the given sectionId exists
    const sectionExists = await Section.findById(req.body.sectionId);  // Assuming you have a section model to check against
    if (!sectionExists) {
      return res.status(400).json({ sectionExists: sectionExists, message: "Section ID does not exist" });
    }

    // Check for existing sub-category with same name in the category
    const existingCategoryName = await Category.findOne({
      sectionId: req.body.sectionId,
      name: req.body.name.trim() // Trim whitespace to avoid duplicate entries
    });

    // Check for existing sub-category
    if (existingCategoryName) {
      return res.status(400).json({
        existingCategoryName: existingCategoryName,
        message: `Category name "${req.body.name}" already exists in this section`
      });
    }


    // Store the extension (without dot) in MongoDB
    const category = new Category({
      sectionId: req.body.sectionId,
      name: req.body.name,
      image: fileExtension,  // Save only the extension (without dot) in MongoDB
      status: "active",
    });

    // Save category to get ID
    const savedCategory = await category.save();

    // Rename uploaded file to category ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/categorys/", savedCategory._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ category: savedCategory, message: "Category added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update category with image and rename file to category ID
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { sectionId, name, image, status } = req.body;

    // Check if the given sectoinId exists
    const sectionExists = await Section.findById(sectionId); // Check if sectoinId exists in the Category collection
    if (!sectionExists) {
      return res.status(400).json({ sectionExists: sectionExists, message: "Section ID does not exist" });
    }

    // Check if the sub-category name is already in use (excluding the current category being updated)
    const existingCategoryName = await Category.findOne({
      name: req.body.name.trim(), // Trim whitespace to avoid duplicate entries
      _id: { $ne: req.params.id }, // Exclude the current sub-category from check
      sectionId: req.body.sectionId // Ensure validation is category-specific
    });

    if (existingCategoryName) {
      return res.status(400).json({
        existingCategoryName: existingCategoryName,
        message: `Category name "${req.body.name}" already exists in this section`
      });
    }

    const updatedData = {
      sectionId,
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

      // Rename uploaded file to category ID
      const oldPath = req.file.path;
      const newPath = path.join("uploads/categorys/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedCategory) {
      res.status(400).json({ updatedCategory: updatedCategory, message: "Category not found" });
    }
    else {
      res.status(200).json({ updatedCategory: updatedCategory, message: "Category updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating Category", error: err });
  }
});



module.exports = router;
