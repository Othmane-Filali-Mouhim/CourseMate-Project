import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import assessmentRoutes from "./routes/assessments.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8000;
const app = express();

// Allow frontend to talk to backend
app.use(cors());

// Allow backend to read JSON data sent from frontend
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'Front-End')));

// Auth routes
app.use("/api/auth", authRoutes);

// Courses routes
app.use("/api/courses", courseRoutes);

// assessment routes
app.use("/api/assessments", assessmentRoutes);

connectDB();

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));