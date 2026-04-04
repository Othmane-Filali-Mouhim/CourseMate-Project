import express from "express";
import { Assessment } from "../models/assessmenModel.js";
import { Course } from "../models/coursesModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET GPA for the logged-in student
router.get("/", protect, async (req, res) => {
  try {
    // Find all courses the student is enrolled in
    const courses = await Course.find({
      enrolledStudents: req.user.userId,
      isActive: true
    });

    if (courses.length === 0) {
      return res.status(200).json({
        gpa: 0,
        totalCredits: 0,
        coursesBreakdown: [],
        message: "No active courses found"
      });
    }

    let totalGradePoints = 0;
    let totalCredits = 0;
    const coursesBreakdown = [];

    // Calculate GPA for each course
    for (const course of courses) {
      // Get all assessments for this course that are completed
      const assessments = await Assessment.find({
        course: course._id,
        status: "completed",
        isTemplate: false  // Student-specific assessments
      });

      let courseTotalMarks = 0;
      let courseEarnedMarks = 0;
      let courseWeightedTotal = 0;

      for (const assessment of assessments) {
        courseEarnedMarks += assessment.earnedMarks || 0;
        courseTotalMarks += assessment.totalMarks || 0;
        
        // Calculate weighted score based on weight percentage
        if (assessment.weight && assessment.totalMarks) {
          const percentageScore = (assessment.earnedMarks / assessment.totalMarks) * 100;
          courseWeightedTotal += (percentageScore * (assessment.weight / 100));
        }
      }

      // Calculate course percentage (0-100)
      let coursePercentage = 0;
      if (courseTotalMarks > 0) {
        coursePercentage = (courseEarnedMarks / courseTotalMarks) * 100;
      } else if (courseWeightedTotal > 0) {
        coursePercentage = courseWeightedTotal;
      }

      // Convert percentage to letter grade and grade points (standard 4.0 scale)
      let letterGrade = "F";
      let gradePoints = 0;

      if (coursePercentage >= 90) {
        letterGrade = "A+";
        gradePoints = 4.0;
      } else if (coursePercentage >= 85) {
        letterGrade = "A";
        gradePoints = 4.0;
      } else if (coursePercentage >= 80) {
        letterGrade = "A-";
        gradePoints = 3.7;
      } else if (coursePercentage >= 77) {
        letterGrade = "B+";
        gradePoints = 3.3;
      } else if (coursePercentage >= 73) {
        letterGrade = "B";
        gradePoints = 3.0;
      } else if (coursePercentage >= 70) {
        letterGrade = "B-";
        gradePoints = 2.7;
      } else if (coursePercentage >= 67) {
        letterGrade = "C+";
        gradePoints = 2.3;
      } else if (coursePercentage >= 63) {
        letterGrade = "C";
        gradePoints = 2.0;
      } else if (coursePercentage >= 60) {
        letterGrade = "C-";
        gradePoints = 1.7;
      } else if (coursePercentage >= 57) {
        letterGrade = "D+";
        gradePoints = 1.3;
      } else if (coursePercentage >= 53) {
        letterGrade = "D";
        gradePoints = 1.0;
      } else if (coursePercentage >= 50) {
        letterGrade = "D-";
        gradePoints = 0.7;
      } else {
        letterGrade = "F";
        gradePoints = 0.0;
      }

      // Assume 3 credits per course 
      const credits = 3;
      totalGradePoints += gradePoints * credits;
      totalCredits += credits;

      coursesBreakdown.push({
        courseCode: course.courseCode,
        courseName: course.name,
        percentage: coursePercentage.toFixed(2),
        letterGrade: letterGrade,
        gradePoints: gradePoints,
        credits: credits
      });
    }

    // Calculate overall GPA
    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.status(200).json({
      gpa: parseFloat(gpa),
      totalCredits: totalCredits,
      totalGradePoints: totalGradePoints.toFixed(2),
      coursesBreakdown: coursesBreakdown,
      message: "GPA calculated successfully"
    });

  } catch (error) {
    console.log("ERROR in GPA calculation:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET GPA for a specific course
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if student is enrolled
    if (!course.enrolledStudents.includes(req.user.userId)) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    const assessments = await Assessment.find({
      course: course._id,
      status: "completed",
      isTemplate: false
    });

    let courseTotalMarks = 0;
    let courseEarnedMarks = 0;
    let courseWeightedTotal = 0;

    for (const assessment of assessments) {
      courseEarnedMarks += assessment.earnedMarks || 0;
      courseTotalMarks += assessment.totalMarks || 0;
      
      if (assessment.weight && assessment.totalMarks) {
        const percentageScore = (assessment.earnedMarks / assessment.totalMarks) * 100;
        courseWeightedTotal += (percentageScore * (assessment.weight / 100));
      }
    }

    let coursePercentage = 0;
    if (courseTotalMarks > 0) {
      coursePercentage = (courseEarnedMarks / courseTotalMarks) * 100;
    } else if (courseWeightedTotal > 0) {
      coursePercentage = courseWeightedTotal;
    }

    res.status(200).json({
      courseCode: course.courseCode,
      courseName: course.name,
      percentage: coursePercentage.toFixed(2),
      totalEarnedMarks: courseEarnedMarks,
      totalPossibleMarks: courseTotalMarks,
      assessmentsCompleted: assessments.length,
      assessmentsBreakdown: assessments
    });

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;