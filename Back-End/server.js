const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
// FIX: was 3000, frontend calls localhost:8000
const PORT = process.env.PORT || 8000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'Front-End')));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// TODO: add these as you build them
// const courseRoutes = require('./routes/courses');
// const assessmentRoutes = require('./routes/assessments');
// app.use('/api/courses', courseRoutes);
// app.use('/api/assessments', assessmentRoutes);

app.listen(PORT, () => {
    console.log('CourseMate running at http://localhost:' + PORT);
});
