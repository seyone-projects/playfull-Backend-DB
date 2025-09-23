const express = require("express");
const Batch = require("../models/Batch");
const User = require("../models/User");
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


// Get collection report with date and batch filters
router.get("/collection-report", async (req, res) => {
  try {
    const { fromDate, toDate, batchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      status: "paid" // Only include paid payments
    };

    // Add date range filter if provided
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

    // Add batch filter if provided
    let batchStudents = [];
    if (batchId && batchId !== "overall") {
      batchStudents = await BatchStudent.find({ batchId });
      const batchStudentIds = batchStudents.map(bs => bs._id);
      query.batchStudentId = { $in: batchStudentIds };
    }


    // Get paginated collection data
    const collections = await BatchStudentPayment.find(query)
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ paymentDateTime: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await BatchStudentPayment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students in filtered batch(es)
    const totalStudents = batchStudents.length;

    // Batch fee (assume same fee for all students in this batch)
    const batchFee = totalStudents > 0 ? batchStudents[0].fee || 0 : 0;

    // Total batch amount = batchFee * totalStudents
    const totalAmount = batchFee * totalStudents;

    // Received amount = sum of all paid amounts
    const receivedSummary = await BatchStudentPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          receivedAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const receivedData = receivedSummary.length ? receivedSummary[0] : {
      receivedAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      count: 0
    };

    // Fix: assign totalAmount directly
    receivedData.totalAmount = totalAmount;
    receivedData.pendingAmount = totalAmount - receivedData.receivedAmount;


    res.status(200).json({
      success: true,
      data: {
        collections,
        currentPage: page,
        totalPages,
        totalItems: total,
        summary: receivedData,
        totalStudents
      },
      message: "Collection report generated successfully"
    });

  } catch (err) {
    console.error("Error generating collection report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating collection report",
      error: err
    });
  }
});

//get pending reports with date and batch filters
router.get("/pending-report", async (req, res) => {
  try {
    const { fromDate, toDate, batchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      status: "active" // Only include paid payments
    };

    // Add date range filter if provided
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Add batch filter if provided
    let batchStudents = [];
    if (batchId && batchId !== "overall") {
      batchStudents = await BatchStudent.find({ batchId });
      const batchStudentIds = batchStudents.map(bs => bs._id);
      query.batchStudentId = { $in: batchStudentIds };
    }

    // Get paginated collection data
    const collections = await BatchStudentPayment.find(query)
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ paymentDateTime: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await BatchStudentPayment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students in filtered batch(es)
    const totalStudents = batchStudents.length;

    // Batch fee (assume same fee for all students in this batch)
    const batchFee = totalStudents > 0 ? batchStudents[0].fee || 0 : 0;

    // Total batch amount = batchFee * totalStudents
    const totalAmount = batchFee * totalStudents;

    // Received amount = sum of all paid amounts
    const receivedSummary = await BatchStudentPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          receivedAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const receivedData = receivedSummary.length ? receivedSummary[0] : {
      receivedAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      count: 0
    };

    // Fix: assign totalAmount directly
    receivedData.totalAmount = totalAmount;
    receivedData.pendingAmount = totalAmount - receivedData.receivedAmount;


    res.status(200).json({
      success: true,
      data: {
        collections,
        currentPage: page,
        totalPages,
        totalItems: total,
        summary: receivedData,
        totalStudents
      },
      message: "Pending report generated successfully"
    });

  } catch (err) {
    console.error("Error generating collection report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating collection report",
      error: err
    });
  }
});

//get batchstudentpayments by batchStudentId with pagination
router.get("/byStudent/:batchStudentId", async (req, res) => {
  try {
    const { batchStudentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(batchStudentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batchStudentId format"
      });
    }

    const payments = await BatchStudentPayment.find({ batchStudentId })
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BatchStudentPayment.countDocuments({ batchStudentId });
    const totalPages = Math.ceil(total / limit);


    //calculate totals correctly
    let totalPaid = 0;
    payments.forEach(p => {
      if (p.status === "paid" && p.amount) {
        totalPaid += Number(p.amount); // ensure numeric
      }
    });

    // Batch fee comes from the populated batchId
    const batchFee = payments.length > 0 ? payments[0].batchStudentId.batchId.fee : 0;
    const totalPending = batchFee - totalPaid;

    // Batch-level calculations   
    let batchStats = null;
    if (payments.length > 0) {
      const batchId = payments[0].batchStudentId.batchId._id;

      // 1) Get all batchStudents for this batch
      const allBatchStudents = await BatchStudent.find({ batchId });

      const noOfStudents = allBatchStudents.length;

      // 2) Calculate total fee to be received
      const totalToBeReceived = noOfStudents * batchFee;

      // 3) Calculate total paid across batch
      const allPayments = await BatchStudentPayment.find({
        batchStudentId: { $in: allBatchStudents.map(s => s._id) }
      });

      let batchTotalPaid = 0;
      allPayments.forEach(p => {
        if (p.status === "paid" && p.amount) {
          batchTotalPaid += Number(p.amount);
        }
      });

      // 4) Pending balance
      const batchPendingBalance = totalToBeReceived - batchTotalPaid;

      batchStats = {
        noOfStudents,
        totalToBeReceived,
        totalReceived: batchTotalPaid,
        pendingBalance: batchPendingBalance
      };
    }

    res.status(200).json({
      success: true,
      data: {
        payments,
        currentPage: page,
        totalPages,
        totalItems: total,
        amount: payments.length > 0 ? payments[0].amount : null,
        totalFee: batchFee,
        totalPaid,
        totalPending,
        batchStats
      },
      message: "Payments fetched successfully"
    });

  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: err
    });
  }
});

//get batchstudentpayments by userId with pagination, total overall fees, total paid, total pending
router.get("/byUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format"
      });
    }

    // Get all batch students for this user
    const batchStudents = await BatchStudent.find({ userId });
    const batchStudentIds = batchStudents.map(bs => bs._id);

    // Get paginated payments
    const payments = await BatchStudentPayment.find({
      batchStudentId: { $in: batchStudentIds }
    })
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BatchStudentPayment.countDocuments({
      batchStudentId: { $in: batchStudentIds }
    });
    const totalPages = Math.ceil(total / limit);

    // Calculate totals
    let totalPaid = 0;
    let totalFees = 0;
    // Get all batch IDs from batchStudents
    const batchIds = batchStudents.map(bs => bs.batchId);

    // Fetch the batches
    const batches = await Batch.find({ _id: { $in: batchIds } });

    // Calculate total fees from batches
    batches.forEach(batch => {
      if (batch.fee) {
        totalFees += Number(batch.fee);
      }
    });

    // Sum up paid amounts
    payments.forEach(p => {
      if (p.status === "paid" && p.amount) {
        totalPaid += Number(p.amount);
      }
    });

    const totalPending = totalFees - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        payments,
        currentPage: page,
        totalPages,
        totalItems: total,
        totalFees,
        totalPaid,
        totalPending
      },
      message: "User payments fetched successfully"
    });

  } catch (err) {
    console.error("Error fetching user payments:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user payments",
      error: err
    });
  }
});


router.get("/monthly-summary", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    // Create date range for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Check if there are any payments in this month (status = paid only)
    const paymentExists = await BatchStudentPayment.exists({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "paid"
    });

    if (!paymentExists) {
      return res.status(200).json({
        success: true,
        data: "no result found",
        message: `No records found for ${month}, ${year}`
      });
    }

    // Get all batches
    const batches = await Batch.find();

    // Build summary data
    const summary = await Promise.all(
      batches.map(async (batch) => {
        // Get all batch students for this batch
        const batchStudents = await BatchStudent.find({ batchId: batch._id })
          .populate("userId");

        // Get user summaries for this batch
        const userSummaries = await Promise.all(
          batchStudents.map(async (bs) => {
            // Payments in this month (only paid)
            const payments = await BatchStudentPayment.find({
              batchStudentId: bs._id,
              createdAt: { $gte: startDate, $lte: endDate },
              status: "paid"
            });

            // All-time payments (only paid)
            const allPayments = await BatchStudentPayment.find({
              batchStudentId: bs._id,
              status: "paid"
            });

            // Monthly paid
            let totalPaid = 0;
            payments.forEach((p) => {
              if (p.amount) totalPaid += Number(p.amount);
            });

            // Lifetime paid
            let overallPaid = 0;
            allPayments.forEach((p) => {
              if (p.amount) overallPaid += Number(p.amount);
            });

            const totalFee = batch.fee || 0;
            const totalPending = totalFee - overallPaid; // ✅ pending considers only paid
            const overallTotal = totalFee;

            return {
              id: bs.userId._id,
              name: bs.userId.username,
              mobile: bs.userId.mobile,
              totalFee,
              totalPaid, // monthly paid
              totalPending, // pending after all-time paid
              overallTotal
            };
          })
        );

        // Calculate batch-level totals
        const overallTotalFee = userSummaries.reduce(
          (acc, u) => acc + u.totalFee,
          0
        );
        const overallTotalPaid = userSummaries.reduce(
          (acc, u) => acc + u.totalPaid,
          0
        );
        const overallTotalPending = userSummaries.reduce(
          (acc, u) => acc + u.totalPending,
          0
        );

        return {
          id: batch._id,
          name: batch.name,
          users: userSummaries,
          overallTotalFee,
          overallTotalPaid,
          overallTotalPending
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        batch: summary
      },
      message: "Monthly summary generated successfully"
    });
  } catch (err) {
    console.error("Error generating monthly summary:", err);
    res.status(500).json({
      success: false,
      message: "Error generating monthly summary",
      error: err
    });
  }
});


//get collection reports by userId with date and batch filters
router.get("/collection-report-by-user", async (req, res) => {
  try {
    const { fromDate, toDate, batchId, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      status: "paid"
    };

    // Add date range filter if provided
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

    // Get batch students based on filters
    let batchStudentQuery = {};
    if (batchId && batchId !== "overall") {
      batchStudentQuery.batchId = batchId;
    }
    if (userId) {
      batchStudentQuery.userId = userId;
    }

    const batchStudents = await BatchStudent.find(batchStudentQuery);
    const batchStudentIds = batchStudents.map(bs => bs._id);
    query.batchStudentId = { $in: batchStudentIds };

    // Get paginated collection data
    const collections = await BatchStudentPayment.find(query)
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ paymentDateTime: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await BatchStudentPayment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students in filtered batch(es)
    const totalStudents = batchStudents.length;

    // Batch fee (assume same fee for all students in this batch)
    const batchFee = totalStudents > 0 ? batchStudents[0].fee || 0 : 0;

    // Total batch amount = batchFee * totalStudents
    const totalAmount = batchFee * totalStudents;

    // Received amount = sum of all paid amounts
    const receivedSummary = await BatchStudentPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          receivedAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const receivedData = receivedSummary.length ? receivedSummary[0] : {
      receivedAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      count: 0
    };

    receivedData.totalAmount = totalAmount;
    receivedData.pendingAmount = totalAmount - receivedData.receivedAmount;

    res.status(200).json({
      success: true,
      data: {
        collections,
        currentPage: page,
        totalPages,
        totalItems: total,
        summary: receivedData,
        totalStudents
      },
      message: "Collection report generated successfully"
    });

  } catch (err) {
    console.error("Error generating collection report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating collection report",
      error: err
    });
  }
});

//get pending reports by userId with date and batch filters
router.get("/pending-report-by-user", async (req, res) => {
  try {
    const { fromDate, toDate, batchId, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      status: "active"
    };

    // Add date range filter if provided
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Get batch students based on filters
    let batchStudentQuery = {};
    if (batchId && batchId !== "overall") {
      batchStudentQuery.batchId = batchId;
    }
    if (userId) {
      batchStudentQuery.userId = userId;
    }

    const batchStudents = await BatchStudent.find(batchStudentQuery);
    const batchStudentIds = batchStudents.map(bs => bs._id);
    query.batchStudentId = { $in: batchStudentIds };

    // Get paginated collection data
    const collections = await BatchStudentPayment.find(query)
      .populate({
        path: 'batchStudentId',
        populate: [
          { path: 'userId' },
          { path: 'batchId' }
        ]
      })
      .sort({ paymentDateTime: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await BatchStudentPayment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Total students in filtered batch(es)
    const totalStudents = batchStudents.length;

    // Batch fee (assume same fee for all students in this batch)
    const batchFee = totalStudents > 0 ? batchStudents[0].fee || 0 : 0;

    // Total batch amount = batchFee * totalStudents
    const totalAmount = batchFee * totalStudents;

    // Received amount = sum of all paid amounts
    const receivedSummary = await BatchStudentPayment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          receivedAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const receivedData = receivedSummary.length ? receivedSummary[0] : {
      receivedAmount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      count: 0
    };

    receivedData.totalAmount = totalAmount;
    receivedData.pendingAmount = totalAmount - receivedData.receivedAmount;

    res.status(200).json({
      success: true,
      data: {
        collections,
        currentPage: page,
        totalPages,
        totalItems: total,
        summary: receivedData,
        totalStudents
      },
      message: "Pending report generated successfully"
    });

  } catch (err) {
    console.error("Error generating pending report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating pending report",
      error: err
    });
  }
});


//get monthly summary reports by userId
router.get("/monthly-summary-by-user", async (req, res) => {
  try {
    const { month, year, userId } = req.query;

    if (!month || !year || !userId) {
      return res.status(400).json({
        success: false,
        message: "Month, year and userId are required"
      });
    }

    // Create date range for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Check if this user has any payments in this month
    const paymentExists = await BatchStudentPayment.exists({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "paid",
      batchStudentId: { $in: await BatchStudent.find({ userId }).distinct("_id") }
    });

    if (!paymentExists) {
      return res.status(200).json({
        success: true,
        data: "no result found",
        message: `No records found for ${month}, ${year}`
      });
    }

    // Get all batch students for this user
    const batchStudents = await BatchStudent.find({ userId })
      .populate("batchId");

    // Build summary data
    const summary = await Promise.all(
      batchStudents.map(async (bs) => {
        // Payments in this month (only paid)
        const payments = await BatchStudentPayment.find({
          batchStudentId: bs._id,
          createdAt: { $gte: startDate, $lte: endDate },
          status: "paid"
        });

        // All-time payments (only paid, for pending)
        const allPayments = await BatchStudentPayment.find({
          batchStudentId: bs._id,
          status: "paid"
        });

        // Monthly total paid
        let totalPaid = 0;
        payments.forEach((p) => {
          if (p.amount) totalPaid += Number(p.amount);
        });

        // Lifetime total paid
        let overallPaid = 0;
        allPayments.forEach((p) => {
          if (p.amount) overallPaid += Number(p.amount);
        });

        const totalFee = bs.batchId.fee || 0;
        const totalPending = totalFee - overallPaid;

        return {
          batchId: bs.batchId._id,
          batchName: bs.batchId.name,
          totalFee,
          totalPaid, // monthly
          totalPending, // lifetime pending          
        };
      })
    );

    // Calculate overall totals
    const overallTotalFee = summary.reduce((acc, s) => acc + s.totalFee, 0);
    const overallTotalPaid = summary.reduce((acc, s) => acc + s.totalPaid, 0);
    const overallTotalPending = summary.reduce((acc, s) => acc + s.totalPending, 0);

    res.status(200).json({
      success: true,
      data: {
        batches: summary,
        overallTotalFee,
        overallTotalPaid,
        overallTotalPending
      },
      message: "Monthly summary generated successfully"
    });
  } catch (err) {
    console.error("Error generating monthly summary:", err);
    res.status(500).json({
      success: false,
      message: "Error generating monthly summary",
      error: err
    });
  }
});

//get all batchstudentpayments reports by fromdate, todate, user mobile
router.get("/search-payment-by-mobile", async (req, res) => {
  try {
    const { fromDate, toDate, mobile } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find user by mobile
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Build date range query
    const dateQuery = {};
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Get batch students for this user
    const batchStudents = await BatchStudent.find({ userId: user._id });
    const batchStudentIds = batchStudents.map(bs => bs._id);

    // Get paid payments
    const paidPayments = await BatchStudentPayment.find({
      ...dateQuery,
      batchStudentId: { $in: batchStudentIds },
      status: "paid"
    }).populate({
      path: 'batchStudentId',
      populate: [
        { path: 'batchId' },   // populate batch
        { path: 'userId' }     // populate student
      ]
    });

    // Get pending payments
    const pendingPayments = await BatchStudentPayment.find({
      ...dateQuery,
      batchStudentId: { $in: batchStudentIds },
      status: "active"
    }).populate({
      path: 'batchStudentId',
      populate: [
        { path: 'batchId' },   // populate batch
        { path: 'userId' }     // populate student
      ]
    });

    // Format response data
    const payments = [];

    paidPayments.forEach(payment => {
      payments.push({
        batchName: payment.batchStudentId.batchId?.name || "-",
        studentname: payment.batchStudentId.userId?.username || "-",
        batchCode: payment.batchStudentId.batchId?.code || "-",
        paymentDateTime: payment.paymentDateTime || "-",
        paymentReference: payment.paymentReference || payment.transactionId || "-",
        paidAmount: payment.amount,
        pendingAmount: 0
      });
    });

    pendingPayments.forEach(payment => {
      payments.push({
        batchName: payment.batchStudentId.batchId?.name || "-",
        studentname: payment.batchStudentId.userId?.username || "-",
        batchCode: payment.batchStudentId.batchId?.code || "-",
        paymentDateTime: payment.paymentDateTime || "-",
        paymentReference: payment.paymentReference || payment.transactionId || "-",
        paidAmount: 0,
        pendingAmount: payment.amount
      });
    });

    // Paginate results
    const paginatedPayments = payments.slice(skip, skip + limit);
    const total = payments.length;
    const totalPages = Math.ceil(total / limit);

    // Calculate totals
    const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        payments: paginatedPayments,
        currentPage: page,
        totalPages,
        totalItems: total,
        summary: {
          totalPaid,
          totalPending
        }
      },
      message: "Payment report generated successfully"
    });

  } catch (err) {
    console.error("Error generating payment report:", err);
    res.status(500).json({
      success: false, 
      message: "Error generating payment report",
      error: err
    });
  }
});



module.exports = router;
