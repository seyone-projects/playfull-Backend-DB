require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { authenticateJWT } = require("./middleware/authMiddleware");


//each entity will have a seperate route file
const countryRoutesOpen = require("./routes/countryRoutesOpen");
const stateRoutesOpen = require("./routes/stateRoutesOpen");
const cityRoutesOpen = require("./routes/cityRoutesOpen");
const yearRoutesOpen = require("./routes/yearRoutesOpen");
const genderRoutesOpen = require("./routes/genderRoutesOpen");
const sectionRoutes = require("./routes/sectionRoutes");
const sectionRoutesOpen = require("./routes/sectionRoutesOpen");
const categoryRoutes = require("./routes/categoryRoutes");
const categoryRoutesOpen = require("./routes/categoryRoutesOpen");
const subCategoryRoutes = require("./routes/subCategoryRoutes");  
const subCategoryRoutesOpen = require("./routes/subCategoryRoutesOpen");
const userRoutes = require("./routes/userRoutes");
const userRoutesOpen = require("./routes/userRoutesOpen");
const courseRoutes = require("./routes/courseRoutes");
const courseRoutesOpen = require("./routes/courseRoutesOpen");
const batchRoutes = require("./routes/batchRoutes");
const batchRoutesOpen = require("./routes/batchRoutesOpen");
const paymodeRoutes = require("./routes/paymodeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentRoutesOpen = require("./routes/paymentRoutesOpen");
const lessonPlannerRoutes = require("./routes/lessonPlannerRoutes");
const lessonPlannerRoutesOpen = require("./routes/lessonPlannerRoutesOpen");
const razorpayRoutesOpen = require("./routes/razorpayRoutesOpen");
const forumRoutes = require("./routes/forumRoutes");
const forumReplyRoutes = require("./routes/forumReplyRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const attendanceRoutesOpen = require("./routes/attendanceRoutesOpen");
const feeSchemeRoutes = require("./routes/feeSchemeRoutes");
const feeSchemeRoutesOpen = require("./routes/feeSchemeRoutesOpen");
const feeSchemePaymentRoutes = require("./routes/feeSchemePaymentRoutes");
const feeSchemePaymentRoutesOpen = require("./routes/feeSchemePaymentRoutesOpen");
const testmailRoutes = require("./routes/testmailRoutes");
const batchStudentRoutes = require("./routes/batchStudentRoutes");
const batchStudentPaymentRoutesOpen = require("./routes/batchStudentPaymentRoutesOpen");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");

//to create node js create and add bodyParse - to read the content from post
const app = express();
app.use(cors());
app.use(bodyParser.json());

const path = require("path");
const LeaveRequest = require("./models/LeaveRequest");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//to connect to mongo db
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

//to activate the routes
app.use("/api/countrys", countryRoutesOpen);
app.use("/api/states", stateRoutesOpen);
app.use("/api/citys", cityRoutesOpen);
app.use("/api/years", yearRoutesOpen);
app.use("/api/genders", genderRoutesOpen);
app.use("/api/sections", sectionRoutesOpen);
app.use("/api/categorys", categoryRoutesOpen);
app.use("/api/subCategorys", subCategoryRoutesOpen);
app.use("/api/users", userRoutesOpen);
app.use("/api/courses", courseRoutesOpen);
app.use("/api/batches", batchRoutesOpen);
app.use("/api/payments", paymentRoutesOpen);
app.use("/api/lessonPlanners", lessonPlannerRoutesOpen);
app.use("/api/razorpay", razorpayRoutesOpen);
app.use("/api/attendances", attendanceRoutesOpen);
app.use("/api/feeSchemes", feeSchemeRoutesOpen);
app.use("/api/feeSchemePayments", feeSchemePaymentRoutesOpen);
app.use("/api/batchStudentPayments", batchStudentPaymentRoutesOpen);

//activating the route with authetication
app.use("/api/sections", sectionRoutes);
app.use("/api/categorys", categoryRoutes);
app.use("/api/subCategorys", subCategoryRoutes);
app.use("/api/users", authenticateJWT, userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/paymodes", paymodeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/lessonPlanners", lessonPlannerRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/forumReplys", forumReplyRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/feeSchemes", feeSchemeRoutes);
app.use("/api/feeSchemePayments", feeSchemePaymentRoutes);
app.use("/api/batchStudents", batchStudentRoutes);
app.use("/api/leaveRequests/", leaveRequestRoutes);

app.use("/api/testmail", testmailRoutes);

//port of this application
const PORT = process.env.PORT || 5000;
//to start the application
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
