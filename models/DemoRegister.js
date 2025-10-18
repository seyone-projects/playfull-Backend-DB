const mongoose = require("mongoose");

const DemoRegisterScheme = new mongoose.Schema(
  {
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    whatAppNumber: {
      type: String,
      required: true,
    },
    standard: {
      type: String,
    },
    board: {
      type: String,
    },
    currentPosition: {
      type: String,
    },
    timeZone: {
      type: String,
      required: true,
    },
    demoDate: {
      type: Date,
      required: true,
    },
    demoTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const DemoRegister = mongoose.model("DemoRegister", DemoRegisterScheme);

module.exports = DemoRegister;
