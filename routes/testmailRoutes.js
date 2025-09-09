const express = require("express");
const router = express.Router();
const { sendHtmlEmail } = require("./mailRoutes");

// Example GET endpoint to test sending mail
router.get("/", async (req, res) => {
  try {
    await sendHtmlEmail("ramyaj.tkp@gmail.com", "Test Mail", "<b>Testing</b>");
    res.json({ success: true, message: "Test mail sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
