const express = require("express");
const Payment = require("../models/Payment");
const Batch = require("../models/Batch");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');


const router = express.Router();

// GET user payment summary (batch-wise + overall)
router.get("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get batches where this user is enrolled
    const batches = await Batch.find({
      "users.userId": userId,
    }).populate("courseId trainerId");

    const batchSummary = [];
    let overallTotalFee = 0;
    let overallTotalPaid = 0;

    for (const batch of batches) {
      const totalFee = batch.fee || 0;

      const payments = await Payment.find({
        userId,
        batchId: batch._id,
        status: "active",
      }).populate("paymodeId");

      const totalPaid = payments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const balance = totalFee - totalPaid;

      batchSummary.push({
        batch,
        payments,
        totalFee,
        totalPaid,
        balance,
      });

      overallTotalFee += totalFee;
      overallTotalPaid += totalPaid;
    }

    const overallBalance = overallTotalFee - overallTotalPaid;

    return res.status(200).json({
      userId,
      batchSummary,
      overallTotalFee,
      overallTotalPaid,
      overallBalance,
      message: "Batch-wise and overall payment summary retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching user payment summary:", err);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Get Payments by userID and batchId with pagination
router.get("/:userId/:batchId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;
    const batchId = req.params.batchId;

    // Fetch paginated payment data
    const payments = await Payment.find({ userId, batchId })
      .populate('paymodeId')
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ userId, batchId });
    const totalPages = Math.ceil(total / limit);

    // ✅ Get total fee from batch
    const batch = await Batch.findById(batchId);
    const batchFee = batch ? batch.fee : 0;

    // ✅ Get total paid amount by user for this batch
    const totalPaidAgg = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          batchId: new mongoose.Types.ObjectId(batchId)
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" }
        }
      }
    ]);

    const totalPaid = totalPaidAgg.length ? totalPaidAgg[0].totalPaid : 0;
    const balance = batchFee - totalPaid;

    // ✅ Send response with additional totals
    res.status(200).json({
      payments,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Payments retrieved successfully",

      // 👇 Added fields (no format change above)
      totalFee: batchFee,
      totalPaidAmount: totalPaid,
      balance: balance
    });
  } catch (err) {
    res.status(400).json({ message: "Error fetching payments", error: err });
  }
});

// Get payments with pagination and totals
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get paginated payments
    const payments = await Payment.find()
      .populate('paymodeId')
      .populate('userId')
      .populate('batchId')
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments();
    const totalPages = Math.ceil(total / limit);

    // Get total amount paid across all payments
    const totalPaidAgg = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" }
        }
      }
    ]);
    const totalPaid = totalPaidAgg.length ? totalPaidAgg[0].totalPaid : 0;

    // Get total fees across all batches
    const totalFeesAgg = await Batch.aggregate([
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$fee" }
        }
      }
    ]);
    const totalFees = totalFeesAgg.length ? totalFeesAgg[0].totalFees : 0;

    // Calculate total balance
    const balance = totalFees - totalPaid;

    res.status(200).json({
      payments,
      currentPage: page,
      totalPages,
      totalItems: total,
      totalPaidAmount: totalPaid,
      totalFees: totalFees,
      balance: balance,
      message: "Payments retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching payments", error: err });
  }
});

//search from payment date, to payment date, userId 
router.get("/search/student/payment", async (req, res) => {
  try {
    const { fromDate, toDate, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0); // start of the day

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999); // end of the day

      query.paymentDateTime = {
        $gte: start,
        $lte: end
      };
    }

    if (userId) {
      query.userId = userId;
    }

    //required formdate
    if (!fromDate) {
      return res.status(400).json({ message: "Please select from date" });
    }

    //required todate
    if (!toDate) {
      return res.status(400).json({ message: "Please select to date" });
    }

    //required userId
    if (!userId) {
      return res.status(400).json({ message: "Please select Student" });
    }

    // Get paginated payments matching query
    const payments = await Payment.find(query)
      .populate('paymodeId')
      .populate('userId')
      .populate('batchId')
      .skip(skip)
      .limit(limit);

    // Count total matching records
    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get total paid amount for filtered date range & user
    const totalPaidAgg = await Payment.aggregate([
      {
        $match: {
          ...query,
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" }
        }
      }
    ]);

    const totalPaid = totalPaidAgg.length ? totalPaidAgg[0].totalPaid : 0;

    res.status(200).json({
      payments,
      currentPage: page,
      totalPages,
      totalItems: total,
      totalPaidAmount: totalPaid,
      message: "Payments retrieved successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Error searching payments",
      error: err
    });
  }
});

// Get payments by batchId with pagination
router.get("/:batchId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const batchId = req.params.batchId;

    const payments = await Payment.find({ batchId })
      .populate('paymodeId')
      .populate('userId')
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ batchId });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      payments,
      currentPage: page,
      totalPages,
      totalItems: total,
      message: "Payments retrieved successfully",
    });
  } catch (err) {
    res.status(400).json({ message: "Error fetching payments", error: err });
  }
});

// Create Razorpay order
router.post("/razorpay/order", async (req, res) => {

  // Initialize Razorpay instance (make sure .env has correct keys loaded)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Invalid or missing amount" });
    }

    const amountInPaise = amount * 100; // Razorpay needs paise

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "order_" + Date.now(),
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: amount,
        currency: order.currency,
        receipt: order.receipt,
        created_at: order.created_at
      },
      message: "Order created successfully"
    });

  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: err
    });
  }
});


module.exports = router;
