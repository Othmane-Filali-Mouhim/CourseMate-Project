import express from "express";
import { Course } from "../models/coursesModel.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== INSTRUCTOR ROUTES =====

// CREATE course
router.post("/", protect, restrictTo("instructor"), async (req, res) => {
  try {
    const { courseCode, name, term } = req.body;

    if (!courseCode || !name || !term) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    const course = await Course.create({
      courseCode,
      name,
      term,
      instructor: req.user.userId
    });

    res.status(201).json({ message: "Course created successfully", course });

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET instructor's own courses
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.userId });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE course
router.put("/:id", protect, restrictTo("instructor"), async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE course
router.delete("/:id", protect, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE course active/inactive
router.patch("/:id/toggle", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    course.isActive = !course.isActive;
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===== STUDENT ROUTES =====

// SEARCH active courses by code or name
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    const courses = await Course.find({
      isActive: true,
      $or: [
        { courseCode: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } }
      ]
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET enrolled courses
router.get("/enrolled", protect, async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user.userId
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ENROLL in a course
router.post("/:id/enroll", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.isActive) return res.status(400).json({ message: "Course is not active" });

    if (course.enrolledStudents.includes(req.user.userId)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    course.enrolledStudents.push(req.user.userId);
    await course.save();

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UNENROLL from a course
router.delete("/:id/enroll", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    course.enrolledStudents = course.enrolledStudents.filter(
      id => id.toString() !== req.user.userId
    );
    await course.save();

    res.json({ message: "Unenrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;