const express = require("express");
const State = require("../models/State");

const router = express.Router();
const multer = require("multer");
const upload = multer();

//Add new State
router.post("/", upload.none(), async (req, res) => {
  try {
    const newState = new State({
      countryId: req.body.countryId,
      name: req.body.name,
      shippingCharge: req.body.shippingCharge,
      noOfDaysMax: req.body.noOfDaysMax,
      noOfDaysMin: req.body.noOfDaysMin,
      status: req.body.status,
    });
    const savedState = await newState.save();
    res.status(200).json({ state: savedState, message: "State created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error creating state", error: err });
  }
});

//Update New State
router.put("/:id", upload.none(), async (req, res) => {
  try {
    const updatedState = await State.findByIdAndUpdate(
      req.params.id,
      {
        countryId: req.body.countryId,
        name: req.body.name,
        shippingCharge: req.body.shippingCharge,
        noOfDaysMax: req.body.noOfDaysMax,
        noOfDaysMin: req.body.noOfDaysMin,
        status: req.body.status,
      },
      { new: true }
    );

    if (!updatedState) {
      return res.status(404).json({ message: "State not found" });
    }

    res.status(200).json({ state: updatedState, message: "State updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating state", error: err });
  }
});

// Get All States
router.get("/", async (req, res) => {
  try {
    const states = await State.find();   
    res.status(200).json({ states: states, message: "All states retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching states", error: err });
  }
});

//get State by id
router.get("/:id", async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    res.status(200).json({ state: state, message: "State retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching state", error: err });
  }
});

module.exports = router;
