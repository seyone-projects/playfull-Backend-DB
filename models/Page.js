const mongoose = require("mongoose");

const PageScheme = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },    
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const Page = mongoose.model("Page", PageScheme);

module.exports = Page;
