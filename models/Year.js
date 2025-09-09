const mongoose = require("mongoose");

const YearScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    current: {
      type: Number,
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

const Year = mongoose.model("Year", YearScheme);

module.exports = Year;
