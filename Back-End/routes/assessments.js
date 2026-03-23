import express from "express";
import { Assessment } from "../models/assessmenModel.js";
import { Course } from "../models/coursesModel.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE assessment
router.post("/", protect, restrictTo("instructor"), async (req, res) => {
  try {
    const { courseId, title, category, weight, totalMarks, dueDate } = req.body;

    if (!courseId || !title || !category || !weight || !totalMarks) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your course" });
    }

    const assessment = await Assessment.create({
      course: courseId,
      createdBy: req.user.userId,
      title,
      category,
      weight,
      totalMarks,
      dueDate,
      isTemplate: true
    });

    res.status(201).json({ message: "Assessment created successfully", assessment });

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET assessments by course
router.get("/:courseId", protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ course: req.params.courseId });
    res.status(200).json(assessments);
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE assessment
router.put("/:id", protect, restrictTo("instructor"), async (req, res) => {
  try {
    const updated = await Assessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Assessment not found" });
    res.json(updated);
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE assessment
router.delete("/:id", protect, restrictTo("instructor"), async (req, res) => {
  try {
    await Assessment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assessment deleted" });
  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;