// ─── Authentication Routes ─────────────────────────────
// Handles: signup, login, logout, get current user

const express = require('express');
const router = express.Router();   // creates a mini-router we can export
const bcrypt = require('bcrypt');
const db = require('../config/database');

// ══════════════════════════════════════════════════════════
// SIGNUP — POST /api/auth/signup
// ══════════════════════════════════════════════════════════
// What happens: user fills the signup form → frontend sends data here
//               → we validate → hash password → save to MySQL → create session

router.post('/signup', async (req, res) => {
    try {
        // 1. Get the data sent from the frontend
        const { fullname, email, password, role } = req.body;
        //    This is called "destructuring" — it pulls fullname, email,
        //    password, and role out of the req.body object

        // 2. Server-side validation (NEVER trust the frontend alone)
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        if (role !== 'student' && role !== 'instructor') {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        // 3. Check if email is already taken
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        //    The ? is a PARAMETERIZED QUERY — MySQL safely escapes the value
        //    This prevents SQL INJECTION attacks
        //    [existing] is destructuring the result array — we only want the first element

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // 4. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        //    bcrypt.hash("mypassword", 10) → "$2b$10$K3Gx..." (irreversible)
        //    saltRounds = 10 means it runs the hashing algorithm 2^10 = 1024 times
        //    Higher = more secure but slower. 10 is the standard.

        // 5. Insert the new user into the database
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [fullname, email, hashedPassword, role]
        );
        //    4 question marks = 4 values inserted safely
        //    result.insertId = the auto-generated ID of the new user

        // 6. Create a session (auto-login after signup)
        req.session.user = {
            id: result.insertId,
            name: fullname,
            email: email,
            role: role
        };
        //    This stores user info in the session
        //    Every future request from this browser will have req.session.user

        // 7. Send success response to the frontend
        res.json({
            success: true,
            redirect: role === 'student'
                ? '/student-dashboard.html'
                : '/instructor-dashboard.html'
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});
module.exports = router;