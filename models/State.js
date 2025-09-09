const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {    
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    shippingCharge: {
      type: Number,
      required: true,
    },
    noOfDaysMax: {
      type: Number,
      required: true,
      default: 0
    },
    noOfDaysMin: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const State = mongoose.model("State", StateSchema);

module.exports = State;
