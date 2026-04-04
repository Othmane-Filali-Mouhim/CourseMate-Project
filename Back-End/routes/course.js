// ─── Course Routes ─────────────────────────────────────
// All routes are protected — instructor only (except GET for students)

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated, isInstructor } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════
// GET /api/courses — get all courses for the logged-in instructor
// ══════════════════════════════════════════════════════════
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let rows;

        if (req.user.role === 'instructor') {
            // Instructor sees only their own courses
            [rows] = await db.query(
                'SELECT * FROM courses WHERE created_by = ?',
                [req.user.id]
            );
        } else {
            // Student sees all enabled courses
            [rows] = await db.query(
                'SELECT * FROM courses WHERE enabled = TRUE'
            );
        }

        res.json(rows);
    } catch (err) {
        console.error('GET /courses error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ══════════════════════════════════════════════════════════
// POST /api/courses — create a new course (instructor only)
// ══════════════════════════════════════════════════════════
router.post('/', isAuthenticated, isInstructor, async (req, res) => {
    try {
        const { courseCode, name, term } = req.body;

        if (!courseCode || !name || !term) {
            return res.status(400).json({ message: 'courseCode, name, and term are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO courses (code, name, term, created_by) VALUES (?, ?, ?, ?)',
            [courseCode, name, term, req.user.id]
        );

        // Return the newly created course
        const [rows] = await db.query(
            'SELECT * FROM courses WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /courses error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ══════════════════════════════════════════════════════════
// PUT /api/courses/:id — update a course (instructor only)
// ══════════════════════════════════════════════════════════
router.put('/:id', isAuthenticated, isInstructor, async (req, res) => {
    try {
        const { courseCode, name, term } = req.body;
        const courseId = req.params.id;

        // Make sure this course belongs to this instructor
        const [rows] = await db.query(
            'SELECT * FROM courses WHERE id = ? AND created_by = ?',
            [courseId, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        await db.query(
            'UPDATE courses SET code = ?, name = ?, term = ? WHERE id = ?',
            [courseCode, name, term, courseId]
        );

        const [updated] = await db.query(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        res.json(updated[0]);
    } catch (err) {
        console.error('PUT /courses/:id error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ══════════════════════════════════════════════════════════
// PATCH /api/courses/:id/toggle — enable/disable a course
// ══════════════════════════════════════════════════════════
router.patch('/:id/toggle', isAuthenticated, isInstructor, async (req, res) => {
    try {
        const courseId = req.params.id;

        const [rows] = await db.query(
            'SELECT * FROM courses WHERE id = ? AND created_by = ?',
            [courseId, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const newStatus = !rows[0].enabled;

        await db.query(
            'UPDATE courses SET enabled = ? WHERE id = ?',
            [newStatus, courseId]
        );

        const [updated] = await db.query(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        res.json(updated[0]);
    } catch (err) {
        console.error('PATCH /courses/:id/toggle error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ══════════════════════════════════════════════════════════
// DELETE /api/courses/:id — delete a course (instructor only)
// ══════════════════════════════════════════════════════════
router.delete('/:id', isAuthenticated, isInstructor, async (req, res) => {
    try {
        const courseId = req.params.id;

        const [rows] = await db.query(
            'SELECT * FROM courses WHERE id = ? AND created_by = ?',
            [courseId, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Delete assessments first (foreign key constraint)
        await db.query('DELETE FROM assessments WHERE course_id = ?', [courseId]);
        await db.query('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
        await db.query('DELETE FROM courses WHERE id = ?', [courseId]);

        res.json({ message: 'Course deleted.' });
    } catch (err) {
        console.error('DELETE /courses/:id error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
