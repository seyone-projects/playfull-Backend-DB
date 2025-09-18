const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema(
  {    
    lessonPlannerId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LessonPlanner',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, 
    applyRemarks:{
      type: String,
    },
    appliedDateTime: {
      type: Date,
    },    
    reponseDateTime:  {
      type: Date,
    },
    responseRemarks:{
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

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);

module.exports = LeaveRequest;
