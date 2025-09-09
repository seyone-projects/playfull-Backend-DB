const express = require("express");
const Paymode = require("../models/Paymode");

const router = express.Router();


// Get All Paymodes
router.get("/", async (req, res) => {
  try {
    const paymodes = await Paymode.find();   
    res.status(200).json({ paymodes: paymodes, message: "All paymodes retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching paymodes", error: err });
  }
});


module.exports = router;
