const mongoose = require("mongoose");

const PaymodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

const Paymode = mongoose.model("Paymode", PaymodeSchema);

module.exports = Paymode;
