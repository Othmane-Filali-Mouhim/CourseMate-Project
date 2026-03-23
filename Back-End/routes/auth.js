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

export default router;