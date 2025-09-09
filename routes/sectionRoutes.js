const express = require("express");
const Section = require("../models/Section");
const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');

// Configuring storage for uploaded files
const storage = multer.diskStorage({
  // Destination folder for storing uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/sections"); // Folder where the image will be saved
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

//create a function to add section with image and image must upload with the name as the section id
// Add section with image and rename file to section ID
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

    // Check for existing section
    const existingSection = await Section.findOne({ name: req.body.name });
    if (existingSection) {
      return res.status(400).json({ existingSection: existingSection, message: "Section name already exists" });
    }

    // Create new section
    const section = new Section({
      name: req.body.name,
      image: fileExtension,
      status: "active"
    });

    // Save section to get ID
    const savedSection = await section.save();

    // Rename uploaded file to section ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/sections/", savedSection._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    res.status(200).json({ section: savedSection, message: "Section added successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update section with image and rename file to section ID
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, image, status } = req.body;

    // Check if the section name is already in use (excluding the current section being updated)
    const existingSection = await Section.findOne({ name: name, _id: { $ne: req.params.id } });
    if (existingSection) {
      return res.status(400).json({ existingSection: existingSection, message: "Section name already exists" });
    }

    const updatedData = {
      name,
      image,
      status,
    };

    // Check if there's a new image uploaded
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

      // Check if the file is either .jpg or .png
      if (fileExtension !== 'jpg' && fileExtension !== 'png'  && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
        return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
      }

      updatedData.image = fileExtension;  // Save only the extension (without dot) in MongoDB

      // Rename uploaded file to section ID
      const oldPath = req.file.path;
      const newPath = path.join("uploads/sections/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedSection) {
      res.status(400).json({ updatedSection: updatedSection, message: "Section not found" });
    }
    else {
      res.status(200).json({ updatedSection: updatedSection, message: "Section updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating Section", error: err });
  }
});

// Delete Section
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleteSection = await Section.findByIdAndDelete(req.params.id);
    if (!deleteSection) {
      res.status(400).json({ deleteSection: deleteSection, message: "Section not found" });
    }
    else {
      res.status(200).json({ deleteSection: deleteSection, message: "Section deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting section", error: err });
  }
});

module.exports = router;
