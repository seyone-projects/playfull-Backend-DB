const mongoose = require("mongoose");

const FeeSchemePaymentScheme = new mongoose.Schema(
  {
    feeSchemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeScheme',
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    dueDate:
    {
      type: Date,
      required: true
    },
    amount:{
      type: Number,
      required: true
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

const FeeSchemePayment = mongoose.model("FeeSchemePayment", FeeSchemePaymentScheme);

module.exports = FeeSchemePayment;
