const express = require("express");
const Country = require("../models/Country");

const router = express.Router();


// Get All Countrys
router.get("/", async (req, res) => {
  try {
    const countrys = await Country.find();   
    res.status(200).json({ countrys: countrys, message: "All countries retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching countries", error: err });
  }
});


module.exports = router;
