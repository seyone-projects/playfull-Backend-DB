const express = require("express");
const mongoose = require('mongoose');
const Course = require("../models/Course");
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
    cb(null, "uploads/courses"); // Folder where the image will be saved
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

    const fileExtension = path.extname(req.file.originalname).slice(1);

    if (!['jpg', 'png', 'JPG', 'PNG'].includes(fileExtension)) {
      return res.status(400).json({ fileExtension, message: "Only .jpg, .JPG, .PNG and .png files are allowed" });
    }

    // Check if the given categoryId exists
    const categoryExists = await Category.findById(req.body.categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category ID does not exist" });
    }

    let subCategoryIds = req.body.subCategoryIds;

    if (!subCategoryIds) {
      return res.status(400).json({ message: "At least one subCategoryId is required" });
    }

    // Force to array even if sent as multiple fields
    if (!Array.isArray(subCategoryIds)) {
      subCategoryIds = [subCategoryIds]; // If single item
    }

    // Convert to ObjectId safely
    try {
      subCategoryIds = subCategoryIds.map(id => new mongoose.Types.ObjectId(id));
    } catch (err) {
      return res.status(400).json({ message: "One or more subCategoryIds are not valid ObjectId strings." });
    }


    // Validate that all subcategories exist and belong to the category
    const validSubCategories = await SubCategory.find({
      _id: { $in: subCategoryIds },
      categoryId: req.body.categoryId
    });

    if (validSubCategories.length !== subCategoryIds.length) {
      return res.status(400).json({ message: "One or more subCategoryIds are invalid or do not belong to the category" });
    }

    // Create the new course
    const course = new Course({
      categoryId: req.body.categoryId,
      subCategoryIds: subCategoryIds,
      name: req.body.name.trim(),
      image: fileExtension,
      status: "active"
    });

    const savedCourse = await course.save();

    const oldPath = req.file.path;
    const newPath = path.join("uploads/courses/", savedCourse._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ course: savedCourse, message: "Course added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { categoryId, name, status } = req.body;

    // Step 1: Validate categoryId
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category ID does not exist" });
    }

    // Step 2: Prepare subCategoryIds
    let subCategoryIds = req.body.subCategoryIds;

    if (!Array.isArray(subCategoryIds)) {
      if (typeof subCategoryIds === 'string') {
        subCategoryIds = subCategoryIds
          .split(',')
          .map(id => id.trim())
          .filter((id, index, self) => id && self.indexOf(id) === index);
      } else {
        return res.status(400).json({ message: "Invalid subCategoryIds format" });
      }
    }

    // Step 3: Validate ObjectId format
    if (!subCategoryIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "One or more subCategoryIds are not valid ObjectIds" });
    }

    // Step 4: Convert subCategoryIds to ObjectIds
    const objectIdArray = subCategoryIds.map(id => new mongoose.Types.ObjectId(id));

    // Step 5: Validate they belong to the selected category
    const validSubCategories = await SubCategory.find({
      _id: { $in: objectIdArray },
      categoryId: categoryId // use as string if stored as string
    });

    const updatedData = {
      categoryId,
      name,
      status,
      subCategoryIds,
    };

    // Handle new image file
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).slice(1);
      if (!['jpg', 'png', 'JPG', 'PNG'].includes(fileExtension)) {
        return res.status(400).json({ fileExtension, message: "Only .jpg, .JPG, .PNG and .png files are allowed" });
      }

      updatedData.image = fileExtension;

      const oldPath = req.file.path;
      const newPath = path.join("uploads/courses/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(400).json({ updatedCourse: updatedCourse, message: "Course not found" });
    }

    res.status(200).json({ updatedCourse: updatedCourse, message: "Course updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error updating course", error: err.message });
  }
});


// Delete subCategory
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleteCourse = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleteCourse) {
      res.status(400).json({ deleteCourse: deleteCourse, message: "Course not found" });
    }
    else {
      res.status(200).json({ deleteCourse: deleteCourse, message: "Course deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting Course", error: err });
  }
});

module.exports = router;
