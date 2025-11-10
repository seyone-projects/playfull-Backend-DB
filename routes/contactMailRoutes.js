const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // memory storage

const { sendHtmlEmail } = require("./mailRoutes");

router.post("/send-contact-form", upload.none(), async (req, res) => {
  try {
    const { name, email, mobile, description } = req.body;


    //name validate
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    //email validate
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    //mobile validate
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    //description validate
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

   
    /** 
    if (String(req.body.mobile).length !== 10 || !/^\d+$/.test(String(req.body.mobile))) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }   
    */

    const subject = "Contact Us Enquiry";

    const htmlContent = `
      <ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Mobile:</b> ${mobile}</li>
        <li><b>Description:</b> ${description}</li>
      </ul>
    `;

    const result = await sendHtmlEmail("support@seyone.co", subject, htmlContent);

    if (result) {
      return res.status(200).json({
        status: true,
        message: "Contact form submitted successfully!",
        data: {
          name,
          email,
          mobile,
          description
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed to send email.",
        data: null
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Server error.",
      data: null
    });
  }
});

module.exports = router;
