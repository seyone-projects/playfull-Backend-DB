const express = require("express");
const DemoRegister = require("../models/DemoRegister");

const router = express.Router();
const multer = require("multer");
const upload = multer();

const { sendHtmlEmail } = require("./mailRoutes");

// Add demo register
router.post("/add", upload.none(), async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!req.body.email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!req.body.mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    if (!req.body.whatAppNumber) {
      return res.status(400).json({ message: "WhatsApp number is required" });
    }
    if (!req.body.stateId) {
      return res.status(400).json({ message: "State is required" });
    }
    if (!req.body.sectionId) {
      return res.status(400).json({ message: "Section is required" });
    }
    if (!req.body.categoryId) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!req.body.subCategoryId) {
      return res.status(400).json({ message: "SubCategory is required" });
    }
    if (!req.body.courseId) {
      return res.status(400).json({ message: "Course is required" });
    }
    if (!req.body.timeZone) {
      return res.status(400).json({ message: "Time zone is required" });
    }
    if (!req.body.demoDate) {
      return res.status(400).json({ message: "Demo date is required" });
    }
    if (!req.body.demoTime) {
      return res.status(400).json({ message: "Demo time is required" });
    }

    // Create new demo registration
    const demoRegister = new DemoRegister({
      stateId: req.body.stateId,
      sectionId: req.body.sectionId,
      categoryId: req.body.categoryId,
      subCategoryId: req.body.subCategoryId,
      courseId: req.body.courseId,
      userId: req.body.userId, // optional if logged in
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email,
      whatAppNumber: req.body.whatAppNumber,
      standard: req.body.standard || "",
      board: req.body.board || "",
      currentPosition: req.body.currentPosition || "",
      timeZone: req.body.timeZone,
      demoDate: req.body.demoDate,
      demoTime: req.body.demoTime,
      status: "active"
    });

    // Save demo registration
    let savedDemo = await demoRegister.save();

    // send mail to admin
    /** 
    // Populate referenced fields for readable names
    savedDemo = await savedDemo.populate([
      { path: "stateId", select: "name" },
      { path: "sectionId", select: "name" },
      { path: "categoryId", select: "name" },
      { path: "subCategoryId", select: "name" },
      { path: "courseId", select: "name" },
      { path: "userId", select: "username" }
    ]);

    // Format demo date & time for email
    const formattedDate = new Date(savedDemo.demoDate)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); // 09-10-2025    

    // Determine demo type
    let demoType = "General";
    let extraFields = "";

    if (savedDemo.standard && savedDemo.board) {
      demoType = "Academic";
      extraFields = `
        <li><b>Standard:</b> ${savedDemo.standard}</li>
        <li><b>Board:</b> ${savedDemo.board}</li>
      `;
    } else if (savedDemo.currentPosition) {
      demoType = "Professional";
      extraFields = `
        <li><b>Current Position:</b> ${savedDemo.currentPosition}</li>
      `;
    }

    // Subject with demo type
    const subject = `${demoType} Demo Registration`;

    // Email content
    const htmlContent = `
      <ul>
        <li><b>Name:</b> ${savedDemo.name}</li>
        <li><b>Email:</b> ${savedDemo.email}</li>
        <li><b>Mobile:</b> ${savedDemo.mobile}</li>
        <li><b>Whatsapp No:</b> ${savedDemo.whatAppNumber}</li>
        ${extraFields}
        <li><b>State:</b> ${savedDemo.stateId?.name || "-"}</li>
        <li><b>Section:</b> ${savedDemo.sectionId?.name || "-"}</li>
        <li><b>Category:</b> ${savedDemo.categoryId?.name || "-"}</li>
        <li><b>Sub Category:</b> ${savedDemo.subCategoryId?.name || "-"}</li>
        <li><b>Course:</b> ${savedDemo.courseId?.name || "-"}</li>
        <li><b>Trainer:</b> ${savedDemo.userId?.username || "-"}</li>
        <li><b>Time Zone:</b> ${savedDemo.timeZone}</li>
        <li><b>Demo Date:</b> ${formattedDate}</li>
        <li><b>Demo Time:</b> ${savedDemo.demoTime}</li>
      </ul>
    `;

    await sendHtmlEmail("ramyaj.tkp@gmail.com", subject, htmlContent);
    **/
    res.status(200).json({
      demoRegister: savedDemo,
      message: "Demo registration successful"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Get all demo registrations with pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of documents
    const total = await DemoRegister.countDocuments();

    // Get paginated demo registrations
    const demoRegistrations = await DemoRegister.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      demoRegistrations,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get demo registration by ID
router.get("/drId/:id", async (req, res) => {
  try {
    // Fetch by ID and populate related fields if they are references
    const demoRegistration = await DemoRegister.findById(req.params.id)
      .populate("stateId")
      .populate("sectionId")
      .populate("categoryId")
      .populate("subCategoryId")
      .populate("courseId")
      .populate("userId");

    if (!demoRegistration) {
      return res.status(404).json({ message: "Demo registration not found" });
    }

    res.status(200).json({
      demoRegistration,
      message: "Demo registration retrieved successfully"
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get all demo registrations by date range
router.get("/dateRange", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (fromDate && toDate) {
      dateFilter = {
        demoDate: {
          $gte: new Date(fromDate + "T00:00:00.000Z"),
          $lte: new Date(toDate + "T23:59:59.999Z")
        }
      };
    }

    const total = await DemoRegister.countDocuments(dateFilter);

    const demoRegistrations = await DemoRegister.find(dateFilter)
      .skip(skip)
      .limit(limit)
      .sort({ demoDate: -1 });

    res.status(200).json({
      demoRegistrations,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
