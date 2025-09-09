const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    //map gender as many to one from Gender.js
    genderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gender",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    // Mobile number must be a 10 digit numeric number and unique
    // Validation is handled using match regex pattern
    mobile: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/
    },
    address: {
      type: String,
    },
    landmark: {
      type: String,
    },
    // Pincode must be a 6 digit numeric number
    // Validation is handled using match regex pattern
    pincode: {
      type: String,
      match: /^[0-9]{6}$/
    },
    whatsapp: {
      type: String,
      match: /^[0-9]{10}$/
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    parentMobile: {
      type: String,
      required: function () {
        return this.role === 'student';
      },
      match: /^[0-9]{10}$/
    },
    parentWhatsapp: {
      type: String,
    },
    parentEmail: {
      type: String,
    },
    trainerPan: {
      type: String,
    },
    trainerAadhar: {
      type: String,
    },
    trainerPanImage: {
      type: String,
    },
    trainerAadharImage: {
      type: String,
    },
    trainerBankName: {
      type: String,
    },
    trainerBankAccountNumber: {
      type: String,
    },
    trainerBankIfscCode: {
      type: String,
    },
    trainerBankBranch: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
