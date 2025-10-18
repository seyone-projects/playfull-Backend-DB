const mongoose = require("mongoose");

const CourseScheme = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
     subCategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', 
        required: true,
      },
    ],
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },   
    price: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    level: {
      type: String,
    },
    language: {
      type: String,
    },
    certificate: {
      type: String,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
     description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Course = mongoose.model("Course", CourseScheme);

module.exports = Course;
