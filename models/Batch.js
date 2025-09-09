const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // Ensure that the code is unique
    },
    image: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    //stardate
    startDate: {
      type: Date,
      required: true,
    },
    //fee
    fee: {
      type: Number,
      required: true,
    },
    //certificate [ true or false ]
    certificate: {
      type: Boolean,
      required: true,
    },
    //trainer
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        // joining date
        joiningDate: {
          type: Date,
          required: true,
        },
      }
    ],
    //fee scheme mapped per user
    feeSchemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeScheme',
    },
    //reference to course
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    trainerCost: {
      type: Number,
      required: true,
      default: 0,
    },
    trainerTds: {
      type: Number,
      required: true,
      default: 0, 
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Batch = mongoose.model("Batch", BatchSchema);

module.exports = Batch;
