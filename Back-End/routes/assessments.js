import express from "express";
import { Assessment } from "../models/assessmenModel.js";
import { Course } from "../models/coursesModel.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import PDFDocument from "pdfkit";

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

    const completed = studentAssessments.filter(
      (a) => a.status === "completed"
    ).length;

    const total = studentAssessments.length;
    const progressPercent =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    let weightSum = 0;
    let scoreSum = 0;

    studentAssessments.forEach((a) => {
      if (
        a.earnedMarks !== null &&
        a.earnedMarks !== undefined &&
        a.weight !== null &&
        a.weight !== undefined
      ) {
        weightSum += Number(a.weight);
        scoreSum += Number(a.earnedMarks) * Number(a.weight);
      }
    });

    const average =
      weightSum === 0 ? null : Math.round(scoreSum / weightSum);

    res.json({
      templates,
      studentAssessments,
      stats: {
        completed,
        total,
        progressPercent,
        average
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// EXPORT grades as PDF or CSV
router.get("/export/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { format } = req.query;

    const assessments = await Assessment.find({
      course: courseId,
      isTemplate: false,
      createdBy: req.user.userId
    });

    if (format === "csv") {
      let csv = "Title,Category,Earned Marks,Total Marks,Weight,Status,Due Date\n";

      assessments.forEach((a) => {
        const row = [
          `"${a.title || ""}"`,
          `"${a.category || ""}"`,
          a.earnedMarks ?? "",
          a.totalMarks ?? "",
          a.weight ?? "",
          `"${a.status || ""}"`,
          a.dueDate ? new Date(a.dueDate).toISOString().split("T")[0] : ""
        ].join(",");

        csv += row + "\n";
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=grades.csv");
      return res.send(csv);
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=grades.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Grade Report", { align: "center" });
    doc.moveDown();

    assessments.forEach((a) => {
      const dueDate = a.dueDate
        ? new Date(a.dueDate).toLocaleDateString()
        : "—";

      doc.fontSize(12).text(`${a.title} (${a.category || "assignment"})`);
      doc
        .fontSize(10)
        .text(
          `Marks: ${a.earnedMarks ?? "—"}/${a.totalMarks ?? 100} | Weight: ${a.weight ?? 0}% | Status: ${a.status || "pending"} | Due: ${dueDate}`
        );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.log("EXPORT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// COPY template → create student assessment
router.post("/copy/:id", protect, async (req, res) => {
  try {
    const template = await Assessment.findById(req.params.id);

    if (!template || !template.isTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }

    const existing = await Assessment.findOne({
      course: template.course,
      createdBy: req.user.userId,
      title: template.title,
      isTemplate: false
    });

    if (existing) {
      return res.status(409).json({ message: "You already added this assessment." });
    }

    const assessment = await Assessment.create({
      course: template.course,
      createdBy: req.user.userId,
      title: template.title,
      category: template.category,
      weight: template.weight,
      totalMarks: template.totalMarks,
      dueDate: template.dueDate,
      earnedMarks: null,
      isTemplate: false,
      status: "pending"
    });

    res.status(201).json({ message: "Assessment copied from template", assessment });
  } catch (error) {
    console.log("COPY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET analytics for instructor (all courses summary)
router.get("/analytics/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get all student assessments for this course
    const assessments = await Assessment.find({
      course: courseId,
      isTemplate: false
    });

    const templates = await Assessment.find({
      course: courseId,
      isTemplate: true
    });

    const totalAssessments = assessments.length;
    const completedAssessments = assessments.filter(a => a.status === "completed").length;

    const completedPercent = totalAssessments === 0
      ? 0
      : Math.round((completedAssessments / totalAssessments) * 100);

    // Average grade across all students (only where earnedMarks exists)
    const graded = assessments.filter(
      a => a.earnedMarks !== null && a.earnedMarks !== undefined
    );

    const avgGrade = graded.length === 0
      ? null
      : Math.round(graded.reduce((sum, a) => sum + Number(a.earnedMarks), 0) / graded.length);

    // Unique students
    const uniqueStudents = [...new Set(assessments.map(a => a.createdBy.toString()))];

    res.json({
      templateCount: templates.length,
      totalAssessments,
      completedAssessments,
      completedPercent,
      avgGrade,
      studentCount: uniqueStudents.length
    });

  } catch (error) {
    console.log("ANALYTICS ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET avg completion across all instructor courses
router.get("/analytics-summary", protect, async (req, res) => {
  try {
    // Get all courses belonging to this instructor
    const courses = await Course.find({ instructor: req.user.userId });

    if (courses.length === 0) {
      return res.json({ avgCompletion: 0 });
    }

    const courseIds = courses.map(c => c._id);

    // Get all student assessments across all instructor courses
    const assessments = await Assessment.find({
      course: { $in: courseIds },
      isTemplate: false
    });

    const total = assessments.length;
    const completed = assessments.filter(a => a.status === "completed").length;

    const avgCompletion = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({ avgCompletion });
  } catch (error) {
    console.log("ANALYTICS SUMMARY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE assessment (instructor or student)
router.post("/", protect, async (req, res) => {
  try {
    const {
      courseId,
      title,
      category,
      weight,
      totalMarks,
      dueDate,
      earnedMarks,
      status
    } = req.body;

    if (!courseId || !title || !weight) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isInstructorTemplate = course.instructor.toString() === req.user.userId;

    const assessment = await Assessment.create({
      course: courseId,
      createdBy: req.user.userId,
      title,
      category: category || "assignment",
      weight: Number(weight),
      totalMarks: totalMarks ? Number(totalMarks) : 100,
      dueDate,
      earnedMarks:
        earnedMarks === null || earnedMarks === undefined || earnedMarks === ""
          ? null
          : Number(earnedMarks),
      isTemplate: isInstructorTemplate ? true : false,
      status: status || "pending"
    });

    res.status(201).json({
      message: "Assessment created successfully",
      assessment
    });
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

    if (!updated) {
      return res.status(404).json({ message: "Assessment not found" });
    }

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