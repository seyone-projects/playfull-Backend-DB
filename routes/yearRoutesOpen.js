const express = require("express");
const Year = require("../models/Year");

const router = express.Router();

// Get All Years
router.get("/", async (req, res) => {
  try {
    const years = await Year.find();
    res.status(200).json({ years: years, message: "All years retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching years", error: err });
  }
});


// Get Year by Current
router.get("/current/:current", async (req, res) => {
  try {
    //const year = await Year.findById(req.params.id);
    const year = await Year.findOne({ current: Number(req.params.current) });
    if (!year) {
      res.status(400).json({ year: year, message: "Year not found" });
    }
    else {
      res.status(200).json({ year: year, message: "Year retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching year", error: err });
  }
});

module.exports = router;
