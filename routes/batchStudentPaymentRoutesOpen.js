const express = require("express");
const BatchStudent = require("../models/BatchStudent");
const BatchStudentPayment = require("../models/BatchStudentPayment");
const mongoose = require("mongoose");
const Razorpay = require('razorpay');


const router = express.Router();

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

router.get("/search/status", async (req, res) => {
  try {
    const { status, fromDate, toDate, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    if (status) {
      query.status = status;
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.paymentDateTime = {
        $gte: start,
        $lte: end
      };
    }

    // filter by userId via batchStudentId
    if (userId) {
      const batchStudents = await BatchStudent.find({ userId });
      const batchStudentIds = batchStudents.map(bs => bs._id);
      query.batchStudentId = { $in: batchStudentIds };
    }

    // Get paginated batch student payments matching query
    const payments = await BatchStudentPayment.find(query)
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .skip(skip)
      .limit(limit);

    // Count total matching records
    const total = await BatchStudentPayment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get total amount for filtered results
    const totalAmountAgg = await BatchStudentPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const totalAmount = totalAmountAgg.length ? totalAmountAgg[0].totalAmount : 0;

    res.status(200).json({
      success: true,
      data: {
        payments,
        currentPage: page,
        totalPages,
        totalItems: total,
        totalAmount
      },
      message: "Batch student payments retrieved successfully"
    });

  } catch (err) {
    console.error("Error searching batch student payments:", err);
    res.status(500).json({
      success: false,
      message: "Error searching batch student payments",
      error: err
    });
  }
});

//update BatchStudentPayment
router.post("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference, paymentDateTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid BatchStudentPayment ID format"
      });
    }

    const updatedPayment = await BatchStudentPayment.findByIdAndUpdate(
      id,
      {
        status: "paid",
        paymentReference: paymentReference,
        paymentDateTime: paymentDateTime || new Date(),
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: "BatchStudentPayment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPayment,
      message: "Payment status updated successfully"
    });

  } catch (err) {
    console.error("Error updating BatchStudentPayment:", err);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: err
    });
  }
});


module.exports = router;
