const mongoose = require("mongoose");

const LessonPlannerSchema = new mongoose.Schema(
  {
    batchId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lessonTopic: {
      type: String,
      required: true,
    },
    lessonDate: {
      type: Date,
      required: true,
    }, 
    lessonTime: {
      type: String,
      required: true
    },
    //lesson duration in mins
    lessonDuration: {
      type: Number,
      required: true,
      min: 0,
      max: 480 // Maximum 8 hours in minutes
    },
    lessonDescription: {
      type: String,
      required: true,
    },
    link:{
      type: String,
      required: true,
    },
    remarks:  {
      type: String,
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

const LessonPlanner = mongoose.model("LessonPlanner", LessonPlannerSchema);

module.exports = LessonPlanner;
