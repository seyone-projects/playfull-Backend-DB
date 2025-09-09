const express = require("express");
const User = require("../models/User");

const router = express.Router();


// Get Users with Pagination
router.get("/", async (req, res) => {
  try {
    // Get page and limit from query params, set defaults if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of users
    const totalUsers = await User.countDocuments();

    // Get paginated users
    const users = await User.find()
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      users: users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers: totalUsers,
      message: "Users retrieved successfully"
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});


// Get User by ID
router.get("/uId/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('genderId')
      .populate('cityId');
    if (!user) {
      res.status(400).json({ user: user, message: "User not found" });
    }
    else {
      res.status(200).json({ user: user, message: "User retrieved successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err });
  }
});


//get all users by role with pagination
router.get("/role/:role", async (req, res) => {
  try {
    // Get page, limit and role from params/query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.params.role;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of users with specified role
    const totalItems = await User.countDocuments({ role: role.toString() });

    // Get paginated users filtered by role
    const users = await User.find({ role: role.toString() })
      .populate('genderId')
      .populate('cityId')
      .skip(skip)
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found for this role" });
    }

    res.status(200).json({
      users: users,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
      message: `Users with role '${role}' retrieved successfully`
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users by role", error: err.message });
  }
});


module.exports = router;
