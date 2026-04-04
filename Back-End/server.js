import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import assessmentRoutes from "./routes/assessments.js";
import gpaRoutes from "./routes/gpa.js";

const port = process.env.PORT || 8000;
const app = express();

// Allow frontend to talk to backend
app.use(cors());

// Allow backend to read JSON data sent from frontend
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

// Courses routes
app.use("/api/courses", courseRoutes);

// assessment routes
app.use("/api/assessments", assessmentRoutes);

// GPA routes
app.use("/api/gpa", gpaRoutes);

connectDB();

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));