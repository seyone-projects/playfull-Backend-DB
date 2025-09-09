const express = require("express");
const Section = require("../models/Section");

const router = express.Router();

// Get sections with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sections = await Section.find()
      .skip(skip)
      .limit(limit);

    const total = await Section.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      sections,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Sections retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching sections", error: err });
  }
});

// Get Section by ID
router.get("/sId/:id", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(400).json({ section: section, message: "Section not found" });
    }
    else {
      res.status(200).json({ section: section, message: "Section retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching section", error: err });
  }
});


module.exports = router;
