const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema(
  {    
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
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

const City = mongoose.model("City", CitySchema);

module.exports = City;
