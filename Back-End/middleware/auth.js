// ─── JWT Auth Middleware ───────────────────────────────
// Protects routes by verifying the Bearer token
// Usage: router.get('/protected', isAuthenticated, handler)

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Please log in first.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, name, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

function isStudent(req, res, next) {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ message: 'Students only.' });
    }
}

function isInstructor(req, res, next) {
    if (req.user && req.user.role === 'instructor') {
        next();
    } else {
        res.status(403).json({ message: 'Instructors only.' });
    }
}

module.exports = { isAuthenticated, isStudent, isInstructor };
