import express from "express";
import { Assessment } from "../models/assessmenModel.js";
import { Course } from "../models/coursesModel.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== IMPORTANT: specific routes BEFORE /:id routes =====

// GET instructor templates + student's own assessments for a course
router.get("/student/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    const templates = await Assessment.find({
      course: courseId,
      isTemplate: true
    });

    const studentAssessments = await Assessment.find({
      course: courseId,
      isTemplate: false,
      createdBy: req.user.userId
    });

    res.json({ templates, studentAssessments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// COPY instructor template to student
router.post("/copy/:id", protect, async (req, res) => {
  try {
    const template = await Assessment.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    const copy = await Assessment.create({
      course: template.course,
      createdBy: req.user.userId,
      title: template.title,
      category: template.category,
      weight: template.weight,
      totalMarks: template.totalMarks,
      dueDate: template.dueDate,
      isTemplate: false,
      status: "pending"
    });

    res.status(201).json({ message: "Template copied", assessment: copy });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE assessment (instructor or student)
router.post("/", protect, async (req, res) => {
  try {
    const { courseId, title, category, weight, totalMarks, dueDate, isTemplate } = req.body;

    if (!courseId || !title || !weight) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // instructor creating template
    const isInstructorTemplate = course.instructor.toString() === req.user.userId;

    const assessment = await Assessment.create({
      course: courseId,
      createdBy: req.user.userId,
      title,
      category: category || "assignment",
      weight,
      totalMarks: totalMarks || 100,
      dueDate,
      isTemplate: isInstructorTemplate ? true : false,
      status: "pending"
    });

    res.status(201).json({ message: "Assessment created successfully", assessment });

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET assessments by course (instructor view)
router.get("/:courseId", protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      course: req.params.courseId,
      isTemplate: true
    });
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE assessment
router.put("/:id", protect, async (req, res) => {
  try {
    const updated = await Assessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Assessment not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE assessment
router.delete("/:id", protect, async (req, res) => {
  try {
    await Assessment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assessment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;