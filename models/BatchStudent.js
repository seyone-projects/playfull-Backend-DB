const mongoose = require("mongoose");

const BatchStudentSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    feeSchemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeScheme',
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

const BatchStudent = mongoose.model("BatchStudent", BatchStudentSchema);

module.exports = BatchStudent;
