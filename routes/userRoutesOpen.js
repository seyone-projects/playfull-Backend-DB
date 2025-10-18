const express = require("express");
const User = require("../models/User");
const City = require("../models/City");
const Gender = require("../models/Gender");
const { sendHtmlEmail } = require("./mailRoutes");

//token creation and encryption
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Importing required modules
const multer = require("multer");
const path = require('path');
const fs = require('fs');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "image") {
      cb(null, "uploads/users/");
    } else if (file.fieldname === "trainerPanImage") {
      cb(null, "uploads/pan/");
    } else if (file.fieldname === "trainerAadharImage") {
      cb(null, "uploads/aadhar/");
    }
    else if (file.fieldname === "educationProof") {
      cb(null, "uploads/education/");
    }
    else if (file.fieldname === "experienceProof") {
      cb(null, "uploads/experience/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// 👉 For /add (multiple fields)
const uploadMulti = multer({ storage }).fields([
  { name: "image", maxCount: 1 },
  { name: "trainerPanImage", maxCount: 1 },
  { name: "trainerAadharImage", maxCount: 1 },
  { name: "educationProof", maxCount: 1 },
  { name: "experienceProof", maxCount: 1 }
]);

// 👉 For /update/:id (single file)
const upload = multer({ storage: storage });

// Add user with image
/** 
router.post("/add", upload.single("image"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract the extension (e.g., .jpg, .png) and remove the dot (.)
    const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

    // Validate file extension
    if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
      return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
    }

    // Check if a user with the same mobile already exists
    const existingUserMobile = await User.findOne({ mobile: req.body.mobile });
    if (existingUserMobile) {
      return res.status(400).json({ existingUserMobile: existingUserMobile, message: "Mobile number already exists" });
    }

    // Check if a user with the same email already exists
    const existingUserEmail = await User.findOne({ email: req.body.email });
    if (existingUserEmail) {
      return res.status(400).json({ existingUserEmail: existingUserEmail, message: "Email already exists" });
    }

    // Check if the given cityId exists
    const cityExists = await City.findById(req.body.cityId);
    if (!cityExists) {
      return res.status(400).json({ cityExists: cityExists, message: "City ID does not exist" });
    }

    // Check if the given genderId exists
    const genderExists = await Gender.findById(req.body.genderId);
    if (!genderExists) {
      return res.status(400).json({ genderExists: genderExists, message: "Gender ID does not exist" });
    }


    // Check if username is provided
    if (!req.body.username) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Validate pincode length
    if (req.body.pincode && req.body.pincode.length !== 6) {
      return res.status(400).json({ message: "Pincode must be exactly 6 digits" });
    }

    // Validate pincode contains only digits
    if (req.body.pincode && !/^\d+$/.test(req.body.pincode)) {
      return res.status(400).json({ message: "Pincode must contain only digits" });
    }

    // Validate mobile number length
    if (req.body.mobile.length !== 10) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    // Validate mobile number contains only digits
    if (!/^\d+$/.test(req.body.mobile)) {
      return res.status(400).json({ message: "Mobile number must contain only digits" });
    }

    // Validate whatsapp number length
    if (req.body.whatsapp.length !== 10) {
      return res.status(400).json({ message: "Whatsapp number must be exactly 10 digits" });
    }

    // Validate whatsapp number contains only digits
    if (!/^\d+$/.test(req.body.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp number must contain only digits" });
    }


    // Validate parent mobile number is required if role is student
    if (req.body.role === 'student') {
      if (!req.body.parentMobile) {
        return res.status(400).json({ message: "Parent mobile number is required for student role" });
      }

      // Validate parent mobile number length
      if (req.body.parentMobile.length !== 10) {
        return res.status(400).json({ message: "Parent mobile number must be exactly 10 digits" });
      }

      // Validate parent mobile number contains only digits  
      if (!/^\d+$/.test(req.body.parentMobile)) {
        return res.status(400).json({ message: "Parent mobile number must contain only digits" });
      }
    }

    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the extension (without dot) in MongoDB
    const user = new User({
      cityId: req.body.cityId,
      genderId: req.body.genderId,
      username: req.body.username,
      email: req.body.email,
      mobile: req.body.mobile,
      address: "",
      landmark: "",
      pincode: "",
      whatsapp: req.body.whatsapp,
      password: hashedPassword,
      image: fileExtension, // Save only the extension (without dot) in MongoDB
      role: req.body.role,
      status: "active",
      joiningDate: req.body.joiningDate,
      parentMobile: req.body.parentMobile,
      parentWhatsapp: req.body.parentWhatsapp,
      parentEmail: req.body.parentEmail,
    });

    // Save category to get ID
    const savedUser = await user.save();

    // Rename uploaded file to category ID
    const oldPath = req.file.path;
    const newPath = path.join("uploads/users/", savedUser._id + "." + fileExtension);

    require('fs').rename(oldPath, newPath, (err) => {
      if (err) throw err;
    });

    /** 

    // Send Mail after trainer is saved 
    if (req.body.role === "trainer") {
      const subject = "Welcome to Playful Pencil";

      // Format joining date as dd-mm-yyyy
      const formattedDate = new Date(savedUser.joiningDate)
        .toLocaleDateString("en-GB"); // en-GB gives dd/mm/yyyy

      const htmlContent = `
       <h3>Dear ${savedUser.username},</h3>
<p>We are delighted to welcome you to the <b>Playful Pencil Team</b> as a valued Trainer!  Your account has been successfully created, and you can now access our training portal.</p>

<h4>Here are your login details:</h4>
<ul>
  <li>🔑 <b>Username / Mobile:</b> ${savedUser.mobile}</li> 
  <li>🔒 <b>Temporary Password:</b> ${req.body.password}</li>
  <li>🌐 <b>Login Portal:</b> <a href="https://seyone.co/" target="_blank">Click Here</a></li>
</ul>
<p>👉 Please log in using the above credentials and <b>change your password </b> immediately for security.</p>
<h4>📌 Your Responsibilities:</h4>
<ul>
  <li> Access and manage your assigned courses.</li>
  <li> Upload and maintain training materials/resources.</li>
  <li> Track student progress and provide timely feedback.</li>
  <li> Conduct classes/sessions as per the schedule.</li>
</ul>

<p>We look forward to your valuable contribution in shaping our students’ learning journey 🚀.</p>

<p>If you have any questions or require support, feel free to reach us at <b>[support@seyone.co / 9043062245]</b>.</p>

<p>Once again, welcome to <b>Playful Pencil</b>!<br/><br/>Best regards,<br/><b>Playful Pencil Team</b></p>

      `;

      await sendHtmlEmail(savedUser.email, subject, htmlContent);
    }

    // Send Mail after student is saved
    if (req.body.role === "student") {
      const subject = "Welcome to Playful Pencil";

      // Format joining date as dd-mm-yyyy
      const formattedDate = new Date(savedUser.joiningDate)
        .toLocaleDateString("en-GB"); // en-GB gives dd/mm/yyyy

      const htmlContent = `
      <h3>Dear ${savedUser.username},</h3>
<p>Welcome to <b>Playful Pencil</b>! We are excited to have you on board. Your account has been successfully created, and you can now access our learning portal.</p>
<h4>Here are your login details:</h4>
<ul>
  <li>🔑 <b>Username / Mobile:</b> ${savedUser.mobile}</li>
  <li>🔒 <b>Temporary Password:</b> ${req.body.password}</li>
  <li>🌐 <b>Login Portal:</b> <a href="https://seyone.co/" target="_blank">Click Here</a></li>
</ul>

<p>👉 Please log in using the above credentials and <b> change your password </b> immediately for security.</p>

<p>If you face any difficulties, feel free to reach us at <b>[support@seyone.co / 9043062245]</b>.</p>

<p>We’re excited to support you in your learning journey 🚀</p>

<p>Thank you,<br/>Best regards,<br/><b>Playful Pencil Team</b></p>

    `;

      await sendHtmlEmail(savedUser.email, subject, htmlContent);
    }
    res.status(200).json({ user: user, message: "User added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

**/

// -------------------- ADD USER ROUTE -------------------- //
router.post("/add", uploadMulti, async (req, res) => {
  try {
    // ---------------- IMAGE VALIDATIONS ---------------- //
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "Profile image is required" });
    }

    const profileExt = path.extname(req.files.image[0].originalname).slice(1);
    const panExt = req.files.trainerPanImage ? path.extname(req.files.trainerPanImage[0].originalname).slice(1) : null;
    const aadharExt = req.files.trainerAadharImage ? path.extname(req.files.trainerAadharImage[0].originalname).slice(1) : null;
    const educationProof = req.files.educationProof ? path.extname(req.files.educationProof[0].originalname).slice(1) : null;
    const experienceProof = req.files.experienceProof ? path.extname(req.files.experienceProof[0].originalname).slice(1) : null;


    const allowedExt = ["jpg", "png", "JPG", "PNG"];
    if (!allowedExt.includes(profileExt)) {
      return res.status(400).json({ message: "Invalid profile image format" });
    }
    if (panExt && !allowedExt.includes(panExt)) {
      return res.status(400).json({ message: "Invalid PAN image format" });
    }
    if (aadharExt && !allowedExt.includes(aadharExt)) {
      return res.status(400).json({ message: "Invalid Aadhaar image format" });
    }
    if (educationProof && !allowedExt.includes(educationProof)) {
      return res.status(400).json({ message: "Invalid Education Proof image format" });
    }
    if (experienceProof && !allowedExt.includes(experienceProof)) {
      return res.status(400).json({ message: "Invalid Experience Proof image format" });
    }

    // ---------------- VALIDATIONS ---------------- //
    // Mobile, email, city, gender, etc. (your same validations)
    const existingUserMobile = await User.findOne({ mobile: req.body.mobile });
    if (existingUserMobile) {
      return res.status(400).json({ message: "Mobile number already exists" });
    }

    const existingUserEmail = await User.findOne({ email: req.body.email });
    if (existingUserEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const cityExists = await City.findById(req.body.cityId);
    if (!cityExists) {
      return res.status(400).json({ message: "City ID does not exist" });
    }

    const genderExists = await Gender.findById(req.body.genderId);
    if (!genderExists) {
      return res.status(400).json({ message: "Gender ID does not exist" });
    }

    if (!req.body.username) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (req.body.pincode && req.body.pincode.length !== 6) {
      return res.status(400).json({ message: "Pincode must be exactly 6 digits" });
    }
    if (req.body.pincode && !/^\d+$/.test(req.body.pincode)) {
      return res.status(400).json({ message: "Pincode must contain only digits" });
    }

    if (req.body.mobile.length !== 10 || !/^\d+$/.test(req.body.mobile)) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    if (req.body.whatsapp.length !== 10 || !/^\d+$/.test(req.body.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp number must be exactly 10 digits" });
    }

    if (req.body.role === 'student') {
      if (!req.body.parentMobile) {
        return res.status(400).json({ message: "Parent mobile number is required for student role" });
      }

      // Validate parent mobile number length
      if (req.body.parentMobile.length !== 10) {
        return res.status(400).json({ message: "Parent mobile number must be exactly 10 digits" });
      }

      // Validate parent mobile number contains only digits  
      if (!/^\d+$/.test(req.body.parentMobile)) {
        return res.status(400).json({ message: "Parent mobile number must contain only digits" });
      }
    }

    //validate trainer fields if role is trainer
    if (req.body.role === 'trainer') {
      if (!req.body.trainerPan) {
        return res.status(400).json({ message: "Pan are required " });
      }
      if (!req.body.trainerAadhar) {
        return res.status(400).json({ message: "Aadhaar is required" });
      }
      if (!req.body.trainerBankName) {
        return res.status(400).json({ message: "Bank Name is required" });
      }
      if (!req.body.trainerBankAccountNumber) {
        return res.status(400).json({ message: "Bank Account Number is required" });
      }
      if (!req.body.trainerBankBranch) {
        return res.status(400).json({ message: "Bank Branch is required" });
      }
      if (!req.body.trainerBankIfscCode) {
        return res.status(400).json({ message: "Bank IFSC Code is required" });
      }

      if (req.body.trainerPan.length !== 10) {
        return res.status(400).json({ message: "Trainer PAN must be exactly 10 characters" });

      }
      if (req.body.trainerAadhar.length !== 12 || !/^\d+$/.test(req.body.trainerAadhar)) {
        return res.status(400).json({ message: "Trainer Aadhaar must be exactly 12 digits" });
      }

      if (!req.body.trainerBankAccountNumber || !/^\d+$/.test(req.body.trainerBankAccountNumber)) {
        return res.status(400).json({ message: "Trainer Bank Account Number must contain only digits" });
      }
      if (req.body.trainerBankAccountNumber.length < 9 || req.body.trainerBankAccountNumber.length > 18) {
        return res.status(400).json({ message: "Trainer Bank Account Number must be between 9 to 18 digits" });
      }
      if (req.body.trainerBankIfscCode.length !== 11) {
        return res.status(400).json({ message: "Trainer Bank IFSC Code must be exactly 11 characters" });
      }
    }

    // ---------------- CREATE USER ---------------- //
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      cityId: req.body.cityId,
      genderId: req.body.genderId,
      username: req.body.username,
      email: req.body.email,
      mobile: req.body.mobile,
      address: "",
      landmark: "",
      pincode: req.body.pincode || "",
      whatsapp: req.body.whatsapp,
      password: hashedPassword,
      image: profileExt, // store only extension
      role: req.body.role,
      status: "active",
      joiningDate: req.body.joiningDate,
      parentMobile: req.body.parentMobile,
      parentWhatsapp: req.body.parentWhatsapp,
      parentEmail: req.body.parentEmail,

      // Trainer fields
      trainerPan: req.body.trainerPan,
      trainerAadhar: req.body.trainerAadhar,
      trainerPanImage: panExt,
      trainerAadharImage: aadharExt,
      trainerBankName: req.body.trainerBankName,
      trainerBankAccountNumber: req.body.trainerBankAccountNumber,
      trainerBankIfscCode: req.body.trainerBankIfscCode,
      trainerBankBranch: req.body.trainerBankBranch,
      educationProof: educationProof,
      experienceProof: experienceProof
    });

    const savedUser = await user.save();

    // ---------------- RENAME FILES ---------------- //
    // Profile
    const oldProfile = req.files.image[0].path;
    const newProfile = path.join("uploads/users/", savedUser._id + "." + profileExt);
    fs.renameSync(oldProfile, newProfile);

    // PAN
    if (req.files.trainerPanImage) {
      const oldPan = req.files.trainerPanImage[0].path;
      const newPan = path.join("uploads/pan/", savedUser._id + "." + panExt);
      fs.renameSync(oldPan, newPan);
    }

    // Aadhaar
    if (req.files.trainerAadharImage) {
      const oldAadhar = req.files.trainerAadharImage[0].path;
      const newAadhar = path.join("uploads/aadhar/", savedUser._id + "." + aadharExt);
      fs.renameSync(oldAadhar, newAadhar);
    }

    //education
    if (req.files.educationProof) {
      const oldEducation = req.files.educationProof[0].path;
      const newEducation = path.join("uploads/education/", savedUser._id + "." + educationProof);
      fs.renameSync(oldEducation, newEducation);
    }

    //experience
    if (req.files.experienceProof) {
      const oldExperience = req.files.experienceProof[0].path;
      const newExperience = path.join("uploads/experience/", savedUser._id + "." + experienceProof);
      fs.renameSync(oldExperience, newExperience);
    }

    // Send Mail after trainer is saved 
    if (req.body.role === "trainer") {
      const subject = "Welcome to Playful Pencil";

      // Format joining date as dd-mm-yyyy
      const formattedDate = new Date(savedUser.joiningDate)
        .toLocaleDateString("en-GB"); // en-GB gives dd/mm/yyyy

      const htmlContent = `
             <h3>Dear ${savedUser.username},</h3>
      <p>We are delighted to welcome you to the <b>Playful Pencil Team</b> as a valued Trainer!  Your account has been successfully created, and you can now access our training portal.</p>
      
      <h4>Here are your login details:</h4>
      <ul>
        <li>🔑 <b>Username / Mobile:</b> ${savedUser.mobile}</li> 
        <li>🔒 <b>Temporary Password:</b> ${req.body.password}</li>
        <li>🌐 <b>Login Portal:</b> <a href="https://seyone.co/" target="_blank">Click Here</a></li>
      </ul>
      <p>👉 Please log in using the above credentials and <b>change your password </b> immediately for security.</p>
      <h4>📌 Your Responsibilities:</h4>
      <ul>
        <li> Access and manage your assigned courses.</li>
        <li> Upload and maintain training materials/resources.</li>
        <li> Track student progress and provide timely feedback.</li>
        <li> Conduct classes/sessions as per the schedule.</li>
      </ul>
      
      <p>We look forward to your valuable contribution in shaping our students’ learning journey 🚀.</p>
      
      <p>If you have any questions or require support, feel free to reach us at <b>[support@seyone.co / 9043062245]</b>.</p>
      
      <p>Once again, welcome to <b>Playful Pencil</b>!<br/><br/>Best regards,<br/><b>Playful Pencil Team</b></p>
      
            `;

      await sendHtmlEmail(savedUser.email, subject, htmlContent);
    }


    // Send Mail after student is saved
    if (req.body.role === "student") {
      const subject = "Welcome to Playful Pencil";

      // Format joining date as dd-mm-yyyy
      const formattedDate = new Date(savedUser.joiningDate)
        .toLocaleDateString("en-GB"); // en-GB gives dd/mm/yyyy

      const htmlContent = `
            <h3>Dear ${savedUser.username},</h3>
      <p>Welcome to <b>Playful Pencil</b>! We are excited to have you on board. Your account has been successfully created, and you can now access our learning portal.</p>
      <h4>Here are your login details:</h4>
      <ul>
        <li>🔑 <b>Username / Mobile:</b> ${savedUser.mobile}</li>
        <li>🔒 <b>Temporary Password:</b> ${req.body.password}</li>
        <li>🌐 <b>Login Portal:</b> <a href="https://seyone.co/" target="_blank">Click Here</a></li>
      </ul>
      
      <p>👉 Please log in using the above credentials and <b> change your password </b> immediately for security.</p>
      
      <p>If you face any difficulties, feel free to reach us at <b>[support@seyone.co / 9043062245]</b>.</p>
      
      <p>We’re excited to support you in your learning journey 🚀</p>
      
      <p>Thank you,<br/>Best regards,<br/><b>Playful Pencil Team</b></p>
      
          `;

      await sendHtmlEmail(savedUser.email, subject, htmlContent);     
 
    }
    res.status(200).json({ user: user, message: "User added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user without password  and with image and rename file to user ID
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { cityId, genderId, username, email, mobile, address, landmark, pincode, whatsapp, status, joiningDate, image, parentMobile, parentEmail, parentWhatsapp } = req.body;

    // Check if joiningDate is present
    if (!joiningDate) {
      return res.status(400).json({ message: "Joining date is required" });
    }

    const existingUserMobile = await User.findOne({ mobile: mobile, _id: { $ne: req.params.id } });
    if (existingUserMobile) {
      return res.status(400).json({ existingUserMobile: existingUserMobile, message: "Mobile number already exists" });
    }

    const existingUserEmail = await User.findOne({ email: email, _id: { $ne: req.params.id } });
    if (existingUserEmail) {
      return res.status(400).json({ existingUserEmail: existingUserEmail, message: "Email already exists" });
    }

    const cityExists = await City.findById(cityId);
    if (!cityExists) {
      return res.status(400).json({ cityExists: cityExists, message: "City ID does not exist" });
    }

    const genderExists = await Gender.findById(genderId);
    if (!genderExists) {
      return res.status(400).json({ genderExists: genderExists, message: "Gender ID does not exist" });
    }

    // Check if username is provided
    if (!username) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Validate pincode length
    if (pincode && pincode.length !== 6) {
      return res.status(400).json({ message: "Pincode must be exactly 6 digits" });
    }

    // Validate pincode contains only digits
    if (pincode && !/^\d+$/.test(pincode)) {
      return res.status(400).json({ message: "Pincode must contain only digits" });
    }

    // Validate whatsapp number length
    if (whatsapp && whatsapp.length !== 10) {
      return res.status(400).json({ message: "Whatsapp number must be exactly 10 digits" });
    }

    // Validate whatsapp number contains only digits
    if (whatsapp && !/^\d+$/.test(whatsapp)) {
      return res.status(400).json({ message: "Whatsapp number must contain only digits" });
    }

    // Validate mobile number length
    if (mobile && mobile.length !== 10) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
    }

    // Validate mobile number contains only digits
    if (mobile && !/^\d+$/.test(mobile)) {
      return res.status(400).json({ message: "Mobile number must contain only digits" });
    }


    // Validate parent mobile number is required if role is student
    if (req.body.role === 'student') {
      if (!parentMobile) {
        return res.status(400).json({ message: "Parent mobile number is required for student role" });
      }

      // Validate parent mobile number length
      if (parentMobile.length !== 10) {
        return res.status(400).json({ message: "Parent mobile number must be exactly 10 digits" });
      }

      // Validate parent mobile number contains only digits
      if (!/^\d+$/.test(parentMobile)) {
        return res.status(400).json({ message: "Parent mobile number must contain only digits" });
      }
    }

    const updatedData = {
      cityId,
      genderId,
      username,
      email,
      mobile,
      address,
      landmark,
      pincode,
      whatsapp,
      status,
      joiningDate,
      image,
      parentMobile,
      parentEmail,
      parentWhatsapp
    };

    // Check if there's a new image uploaded
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).slice(1); // Remove the dot from the extension

      // Check if the file is either .jpg or .png
      if (fileExtension !== 'jpg' && fileExtension !== 'png' && fileExtension !== 'JPG' && fileExtension !== 'PNG') {
        return res.status(400).json({ fileExtension: fileExtension, message: "Only .jpg, .JPG, .PNG and .png  files are allowed" });
      }

      updatedData.image = fileExtension;  // Save only the extension (without dot) in MongoDB

      // Rename uploaded file to category ID
      const oldPath = req.file.path;
      const newPath = path.join("uploads/users/", req.params.id + "." + fileExtension);

      require('fs').rename(oldPath, newPath, (err) => {
        if (err) throw err;
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ updatedUser: updatedUser, message: "User not found" });
    } else {
      res.status(200).json({ updatedUser: updatedUser, message: "User updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err });
  }
});

// Login User 
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  const user = await User.findOne({ mobile });

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });


  const token = jwt.sign(
    { id: user._id, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // Include user and role in response
  res.status(200).json({
    token: token,
    message: "Login successful",
    user: {
      _id: user._id,
      mobile: user.mobile,
      role: user.role,
    }
  });
});

//creat a function to get user by token
router.get("/user", async (req, res) => {
  //const token = req.header("Authorization");
  //read token from url
  const { token } = req.query;
  const btoken = "Bearer " + token;

  if (!btoken) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(btoken.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    const user = await User.findById(req.user.id);
    //res.json(user);
    res.status(200).json({ user: user, message: "User Details" });
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
});

// Update old and new password by userId
router.post("/update-password/:id", upload.none(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Find user by ID
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ updatedUser: updatedUser, message: "User not found" });
    }
    else {
      res.status(200).json({ updatedUser: updatedUser, message: "Password updated successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//creat a function to get logout by token
router.get("/logout", async (req, res) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Verify the token
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // Return success response
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

//update new password by userId
router.post("/update-member-password/:id", upload.none(), async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Find user by ID
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ updatedUser: updatedUser, message: "User not found" });
    }
    else {
      res.status(200).json({ updatedUser: updatedUser, message: "Password updated successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password route
router.post("/forgot-password", upload.none(), async (req, res) => {
  try {
    const { mobile } = req.body;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "User not found with this mobile number" });
    }

    // Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    // Update user with hashed OTP
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { password: hashedOtp },
      { new: true }
    );

    // Send OTP via email
    const subject = "Password recovery - Playful pencil";
    const htmlContent = `
      <h3>Dear ${user.username},</h3>
      <p>We have reset your password to <b>${otp}</b></p>
      <p>Please try to login now with your mobile and this new password.</p>      
      <p>Best regards,<br/><b>Playful Pencil Team</b></p>
    `;

    await sendHtmlEmail(user.email, subject, htmlContent);

    res.status(200).json({
      message: "OTP has been sent to your registered email",
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get redirect URL based on role
router.post("/single-signin-redirect-url", upload.none(), async (req, res) => {
  try {
    const { mobile } = req.body;

    // Find user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let redirectUrl = "";

    // Set redirect URL based on role
    switch (user.role) {
      case "admin":
        redirectUrl = `http://localhost:3000/login?mobile=${mobile}`;
        break;
      case "trainer":
        redirectUrl = `http://localhost:3002/login?mobile=${mobile}`;
        break;
      case "student":
        redirectUrl = `http://localhost:3001/login?mobile=${mobile}`;
        break;
      default:
        redirectUrl = "/";
    }


    res.status(200).json({
      redirectUrl,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//get all users by role with pagination
router.get("/userRole/:role", async (req, res) => {
  try {
    // Get page, limit and role from params/query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.params.role;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of users with specified role
    const totalItems = await User.countDocuments({ role: role.toString() });

    // Get paginated users filtered by role
    const users = await User.find({ role: role.toString() })
      .populate('genderId')
      .populate('cityId')
      .skip(skip)
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found for this role" });
    }

    res.status(200).json({
      users: users,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      message: `Users with role '${role}' retrieved successfully`
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users by role", error: err.message });
  }
});


module.exports = router;


