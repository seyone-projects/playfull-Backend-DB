const express = require("express");
const Page = require("../models/Page");
const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/pages"); // Folder where the image will be saved
  },
  // Generating a unique filename for each uploaded file
  filename: function (req, file, cb) {
    const filenameWithoutExt = Date.now().toString(); // Generate a unique filename without extension
    const extension = path.extname(file.originalname); // Extract the extension (e.g., .jpg, .png)
    cb(null, filenameWithoutExt + extension); // Save full filename with extension
  }
});

// Create multer upload instance with the specified storage configuration
const upload = multer({ storage: storage });

//create a function to add page with image and image must upload with the name as the page id
// Add page with image and rename file to page ID
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract file extension without dot
    const fileExtension = path.extname(req.file.originalname).slice(1);

    // Validate file extension
    if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
      return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
    }

    // Check for existing page
    const existingPage = await Page.findOne({ title: req.body.title });
    if (existingPage) {
      return res.status(400).json({ existingPage: existingPage, message: "Page title already exists" });
    }

    // Create new page
    const page = new Page({
      title: req.body.title,
      image: fileExtension,
      description: req.body.description,
      status: "active"
    });

    // Save page to get ID
    const savedPage = await page.save();

    // Rename uploaded file to page ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/pages/", savedPage._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ page: savedPage, message: "Page added successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update page with image and rename file to page ID
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, status } = req.body;

    // Check if the page title is already in use (excluding current page)
    const existingPage = await Page.findOne({ title: title, _id: { $ne: req.params.id } });
    if (existingPage) {
      return res.status(400).json({ existingPage: existingPage, message: "Page title already exists" });
    }

    const updatedData = {
      title,
      description,
      status
    };

    // Handle new image upload if provided
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).slice(1);

      // Validate file extension
      if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
        return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png files are allowed" });
      }

      updatedData.image = fileExtension;

      // Rename uploaded file to page ID
      const oldPath = req.file.path;
      const newPath = path.join("uploads/pages/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedPage = await Page.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedPage) {
      return res.status(400).json({ message: "Page not found" });
    }

    res.status(200).json({ page: updatedPage, message: "Page updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error updating page", error: error.message });
  }
});

// Delete Page
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletePage = await Page.findByIdAndDelete(req.params.id);
    if (!deletePage) {
      res.status(400).json({ deletePage: deletePage, message: "Page not found" });
    }
    else {
      res.status(200).json({ deletePage: deletePage, message: "Page deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting page", error: err });
  }
});

module.exports = router;
