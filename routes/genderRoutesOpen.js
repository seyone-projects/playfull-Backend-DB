const express = require("express");
const Gender = require("../models/Gender");

const router = express.Router();


// Get All Genders
router.get("/", async (req, res) => {
  try {
    const genders = await Gender.find();   
    res.status(200).json({ genders: genders, message: "All genders retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching genders", error: err });
  }
});


module.exports = router;
