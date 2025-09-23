const express = require("express");
const Page = require("../models/Page");

const router = express.Router();


// Get All Pages
router.get("/", async (req, res) => {
  try {
    const pages = await Page.find();
    res.status(200).json({ pages: pages, message: "All pages retrieved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pages", error: err });
  }
});


// Get Page by ID
router.get("/pgId/:id", async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(400).json({ page: page, message: "Page not found" });
    }
    else {
      res.status(200).json({ page: page, message: "Page retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching page", error: err });
  }
});


module.exports = router;
