import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/usersModel.js";
import jwt from "jsonwebtoken";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

//POST/api/signup//
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log(req.body);


    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const allowedRoles = ["student", "instructor"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This email already is being used." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(200).json({ message: "User created successfully" });

  } catch (error) {
  console.log("ERROR:", error.message); 
  res.status(500).json({ message: "Server error", error });
}
});

//Post/api/login//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields are present
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Email or Password" })
    }

    const token = jwt.sign(
    { userId: user._id,
      role: user.role
     },        
    process.env.JWT_SECRET,      
    { expiresIn: "7d" }          
  );
      
  res.status(200).json({ message: "Login successful", token, role: user.role });


  } catch (error) {
    res.status(500).json({message: "Server error", error });
  }

});

// GET current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE profile (name + email)
router.put("/me", protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existing = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE password
router.put("/me/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be 6+ characters" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;