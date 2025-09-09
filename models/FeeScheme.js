const mongoose = require("mongoose");

const FeeSchemeSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    remarks: {
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

const FeeScheme = mongoose.model("FeeScheme", FeeSchemeSchema);

module.exports = FeeScheme;
