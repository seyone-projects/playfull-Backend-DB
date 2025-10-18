const mongoose = require("mongoose");

const UserCourseSchema = new mongoose.Schema(
  {  
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
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

const UserCourse = mongoose.model("UserCourse", UserCourseSchema);

module.exports = UserCourse;
