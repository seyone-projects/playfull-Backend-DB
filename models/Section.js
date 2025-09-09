const mongoose = require("mongoose");

const SectionScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
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

const Section = mongoose.model("Section", SectionScheme);

module.exports = Section;
