import express from "express";
import bcrypt from "bcrypt";
import {User} from "../models/usersModel.js"; 

const router = express.Router();

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

    // ADD THIS LINE
    const allUsers = await User.find({});
    console.log("All users in DB:", allUsers)

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
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;