const express = require("express");
const app = express();
app.use(express.json());

const router = express.Router();

const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR',  batch, name, email, mobile } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: parseInt(amount), // in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        batch: batch || '',
        name: name || '',
        email: email || '',
        mobile: mobile || '',
      }
    };

    const order = await razorpayInstance.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};


module.exports = router;
