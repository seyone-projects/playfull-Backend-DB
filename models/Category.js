const mongoose = require("mongoose");

const CategoryScheme = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true
    },
    name: {
      type: String,
      required: true,
      unique: true
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

const Category = mongoose.model("Category", CategoryScheme);

module.exports = Category;
