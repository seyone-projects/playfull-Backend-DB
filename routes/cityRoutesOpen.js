const express = require("express");
const City = require("../models/City");

const router = express.Router();


// Get All Citys
router.get("/", async (req, res) => {
  try {
    const citys = await City.find();   
    res.status(200).json({ citys: citys, message: "All cities retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching cities", error: err });
  }
});


module.exports = router;
