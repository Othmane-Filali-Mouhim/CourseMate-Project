import express from "express";
import { Course } from "../models/coursesModel.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();
//add the course
router.post("/", protect, restrictTo("instructor"), async (req,res) =>{

    const { courseCode, name, term } = req.body;
try {
    // Validate fields
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
      instructor: req.user.userId  // comes from the token
    });

    res.status(201).json({ message: "Course created successfully", course });
    
} catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error", error });
}

});
//get the course
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find({
      instructor: req.user.userId
    });

    res.status(200).json(courses);

  } catch (error) {
    console.log("ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:id", protect, restrictTo("instructor"), async (req,res)=>{
    const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
   res.json(updatedCourse);
})
router.delete("/:id", async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

router.patch("/:id/toggle", async (req, res) => {
  const course = await Course.findById(req.params.id);

  course.isActive = !course.isActive;
  await course.save();

  res.json(course);
});
export default router;