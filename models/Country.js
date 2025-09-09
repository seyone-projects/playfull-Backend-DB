const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
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

const Country = mongoose.model("Country", CountrySchema);

module.exports = Country;
