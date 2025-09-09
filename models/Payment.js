const mongoose = require("mongoose");

const PaymentScheme = new mongoose.Schema(
  {
    paymodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paymode',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },   
    amount: {
      type: Number,
      required: true
    },
    paymentDateTime: {
      type: Date,
      required: true
    },
    paymentReference: {
      type: String,      
    },
    reason: {
      type: String,      
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", PaymentScheme);

module.exports = Payment;

