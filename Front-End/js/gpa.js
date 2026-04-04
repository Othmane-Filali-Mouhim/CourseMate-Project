// gpa.js
const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

console.log("Token exists?", !!token);
console.log("BASE_URL:", BASE_URL);

// Profile dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

if (menu && dropdown) {
    menu.addEventListener("click", (e) => {
        dropdown.classList.toggle("open");
        e.stopPropagation();
    });
    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target)) dropdown.classList.remove("open");
    });
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

function getGradeClass(letter) {
    if (letter.startsWith('A')) return 'grade-A';
    if (letter.startsWith('B')) return 'grade-B';
    if (letter.startsWith('C')) return 'grade-C';
    if (letter.startsWith('D')) return 'grade-D';
    return 'grade-F';
}

function getOverallLetterGrade(gpa) {
    if (gpa >= 3.7) return 'A';
    if (gpa >= 3.3) return 'B+';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.7) return 'B-';
    if (gpa >= 2.3) return 'C+';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.7) return 'C-';
    if (gpa >= 1.3) return 'D+';
    if (gpa >= 1.0) return 'D';
    if (gpa >= 0.7) return 'D-';
    return 'F';
}

function renderGPADashboard(data, container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    if (data.message === "No active courses found" || !data.coursesBreakdown || data.coursesBreakdown.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <span class="material-symbols-outlined">info</span>
                No active courses found. Enroll in courses and complete assessments to see your GPA.
            </div>
        `;
        return;
    }
    
    const gpa = data.gpa;
    const totalCredits = data.totalCredits;
    const totalGradePoints = data.totalGradePoints;
    const courses = data.coursesBreakdown;
    const overallLetter = getOverallLetterGrade(gpa);
    
    const aCount = courses.filter(c => c.letterGrade.startsWith('A')).length;
    const bCount = courses.filter(c => c.letterGrade.startsWith('B')).length;
    const cCount = courses.filter(c => c.letterGrade.startsWith('C')).length;
    
    let coursesHtml = '';
    courses.forEach(course => {
        const percentage = parseFloat(course.percentage);
        const gradeClass = getGradeClass(course.letterGrade);
        
        coursesHtml += `
            <tr>
                <td><strong>${course.courseCode}</strong><br><span style="font-size:12px;color:#6B7280;">${course.courseName}</span></td>
                <td>${course.percentage}%</td>
                <td><span class="grade-badge ${gradeClass}">${course.letterGrade}</span></td>
                <td>${course.gradePoints.toFixed(2)}</td>
                <td>${course.credits}</td>
                <td><div class="progress-bar-container"><div class="progress-bar" style="width:${percentage}%"></div></div></td>
            </tr>
        `;
    });
    
    container.innerHTML = `
        <div class="gpa-overview">
            <div class="gpa-score">
                <div class="label">CUMULATIVE GPA</div>
                <div class="value">${gpa.toFixed(2)}</div>
                <div class="scale">/ 4.00 (${overallLetter})</div>
            </div>
            <div class="gpa-stats">
                <div class="stat"><div class="value">${totalCredits}</div><div class="label">Total Credits</div></div>
                <div class="stat"><div class="value">${totalGradePoints}</div><div class="label">Grade Points</div></div>
                <div class="stat"><div class="value">${courses.length}</div><div class="label">Courses</div></div>
            </div>
        </div>
        <div class="summary-cards">
            <div class="summary-card"><div class="icon">🎯</div><div class="value">${aCount}</div><div class="label">A Grades</div></div>
            <div class="summary-card"><div class="icon">📈</div><div class="value">${bCount}</div><div class="label">B Grades</div></div>
            <div class="summary-card"><div class="icon">⭐</div><div class="value">${cCount}</div><div class="label">C Grades</div></div>
        </div>
        <div class="courses-section">
            <div class="section-header"><h2><span class="material-symbols-outlined">menu_book</span> Course Breakdown</h2></div>
            <div class="courses-table">
                <table>
                    <thead><tr><th>Course</th><th>Percentage</th><th>Letter Grade</th><th>Grade Points</th><th>Credits</th><th>Progress</th></tr></thead>
                    <tbody>${coursesHtml}</tbody>
                </table>
            </div>
        </div>
        <div class="gpa-scale">
            <h3>GPA Scale (4.0 System)</h3>
            <div class="scale-grid">
                <div class="scale-item"><span class="scale-letter">A+</span><span class="scale-percent">90-100% (4.0)</span></div>
                <div class="scale-item"><span class="scale-letter">A</span><span class="scale-percent">85-89% (4.0)</span></div>
                <div class="scale-item"><span class="scale-letter">A-</span><span class="scale-percent">80-84% (3.7)</span></div>
                <div class="scale-item"><span class="scale-letter">B+</span><span class="scale-percent">77-79% (3.3)</span></div>
                <div class="scale-item"><span class="scale-letter">B</span><span class="scale-percent">73-76% (3.0)</span></div>
                <div class="scale-item"><span class="scale-letter">B-</span><span class="scale-percent">70-72% (2.7)</span></div>
                <div class="scale-item"><span class="scale-letter">C+</span><span class="scale-percent">67-69% (2.3)</span></div>
                <div class="scale-item"><span class="scale-letter">C</span><span class="scale-percent">63-66% (2.0)</span></div>
                <div class="scale-item"><span class="scale-letter">C-</span><span class="scale-percent">60-62% (1.7)</span></div>
                <div class="scale-item"><span class="scale-letter">F</span><span class="scale-percent">0-49% (0.0)</span></div>
            </div>
        </div>
    `;
}

async function fetchGPA() {
    const container = document.getElementById('gpaContent');
    
    if (!token) {
        container.innerHTML = `<div class="error-message"><span class="material-symbols-outlined">lock</span> Please login to view your GPA.</div>`;
        return;
    }
    
    try {
        console.log("Fetching GPA from:", `${BASE_URL}/gpa`);
        const response = await fetch(`${BASE_URL}/gpa`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("GPA Data received:", data);
        renderGPADashboard(data, container);
        
    } catch (error) {
        console.error('Error fetching GPA:', error);
        container.innerHTML = `<div class="error-message"><span class="material-symbols-outlined">error</span> Failed to load GPA data. Make sure backend is running on port 8000.<br><br>Error: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', fetchGPA);