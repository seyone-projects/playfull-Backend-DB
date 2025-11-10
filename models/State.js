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
