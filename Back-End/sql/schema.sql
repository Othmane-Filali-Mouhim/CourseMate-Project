-- CourseMate Database Schema
-- Run this ONCE to create all tables

USE coursemate;

-- ─── USERS ────────────────────────────────────────────
-- Stores both students and instructors
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── COURSES ──────────────────────────────────────────
-- Created by instructors
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    instructor_name VARCHAR(100),
    term VARCHAR(30),
    enabled BOOLEAN DEFAULT TRUE,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ─── ENROLLMENTS ──────────────────────────────────────
-- Links students to courses (many-to-many)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE(student_id, course_id)
);

-- ─── ASSESSMENTS ──────────────────────────────────────
-- Belongs to a course (quizzes, labs, exams, etc.)
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    due_date DATE,
    weight_pct DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ─── GRADES ───────────────────────────────────────────
-- A student's grade on one assessment
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assessment_id INT NOT NULL,
    grade_pct DECIMAL(5,2),
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id),
    UNIQUE(student_id, assessment_id)
);
```