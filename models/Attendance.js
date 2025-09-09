const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    batchId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
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
    attendanceDate:{
      type: Date,
    },
    attendanceStatus: {
      type: String,
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

const Attendance = mongoose.model("Attendance", AttendanceSchema);

module.exports = Attendance;
