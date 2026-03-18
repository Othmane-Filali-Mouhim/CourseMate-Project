import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";

const port = process.env.PORT || 8080;
const app = express();

// Allow frontend to talk to backend
app.use(cors());

// Allow backend to read JSON data sent from frontend
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);

connectDB();

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));