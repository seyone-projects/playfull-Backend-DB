const mongoose = require("mongoose");

const BatchStudentPaymentSchema = new mongoose.Schema(
  {
    batchStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BatchStudent',
      required: true
    },
    amount: {
      type: Number,
      required: true, 
    },
    lastDate: { 
      type: Date,
      required: true,
    },
    paymentReference: {   
      type: String,
    },
    paymentDateTime: {
      type: Date,
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

const BatchStudentPayment = mongoose.model("BatchStudentPayment", BatchStudentPaymentSchema);

module.exports = BatchStudentPayment;
