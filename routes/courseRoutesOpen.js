const express = require("express");
const mongoose = require('mongoose');
const Course = require("../models/Course");

const router = express.Router();

// Get all subcategorys with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await Course.find()
      .populate('categoryId')
      .populate('subCategoryIds')
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      courses,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Courses retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err });
  }
});


// Get course by ID
router.get("/cId/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(400).json({ course: course, message: "Course not found" });
    }
    else {
      res.status(200).json({ course: course, message: "Course retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching course", error: err });
  }
});


// Get courses by category ID with pagination
router.get("/categoryId/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ categoryId: req.params.id })
      .populate('categoryId')
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments({ categoryId: req.params.id });
    const totalPages = Math.ceil(total / limit);

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this category" });
    }

    res.status(200).json({
      courses,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Courses retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err });
  }
});

// Get courses by sub categories ID with pagination
router.get("/subcategoryId/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const subcategoryObjectId = new mongoose.Types.ObjectId(req.params.id);

    const courses = await Course.find({ subCategoryIds: subcategoryObjectId })
      .populate('categoryId')
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments({ subCategoryIds: subcategoryObjectId });
    const totalPages = Math.ceil(total / limit);

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found for this subcategory" });
    }

    res.status(200).json({
      courses,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Courses retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err.message });
  }
});


module.exports = router;
