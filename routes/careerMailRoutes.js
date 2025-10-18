const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // memory storage

const { sendHtmlEmail } = require("./mailRoutes");

router.post("/send-career-form", upload.none(), async (req, res) => {
  try {
    const { name, email, mobile, whatsappNo, gender, city, education } = req.body;


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

    //whatsappNo validate
    if (!whatsappNo) {
      return res.status(400).json({ message: "Whatsapp number is required" });
    }

    //gender validate
    if (!gender) {
      return res.status(400).json({ message: "Gender is required" });
    }

    //city validate
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    //education validate
    if (!education) {
      return res.status(400).json({ message: "Education details are required" });
    }
    /** 
    if (String(req.body.mobile).length !== 10 || !/^\d+$/.test(String(req.body.mobile))) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    if (String(req.body.whatsappNo).length !== 10 || !/^\d+$/.test(String(req.body.whatsappNo))) {
      return res.status(400).json({ message: "Whatsapp number must be exactly 10 digits" });
    }
    */


    const subject = "New Career Enquiry";

    const htmlContent = `
      <ul>
        <li><b>Name:</b> ${name}</li>
        <li><b>Email:</b> ${email}</li>
        <li><b>Mobile:</b> ${mobile}</li>
        <li><b>Whatsapp No:</b> ${whatsappNo}</li>
        <li><b>Gender:</b> ${gender}</li>
        <li><b>City:</b> ${city}</li>
        <li><b>Education Details:</b> ${education}</li>
      </ul>
    `;

    const result = await sendHtmlEmail("ramyaj.tkp@gmail.com", subject, htmlContent);

    if (result) {
      return res.status(200).json({
        status: true,
        message: "Career form submitted successfully!",
        data: {
          name,
          email,
          mobile,
          whatsappNo,
          gender,
          city,
          education
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
