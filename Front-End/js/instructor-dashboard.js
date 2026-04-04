// Auth + API
const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

// Profile dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});



// Dashboard stats elements

const totalCoursesEl = document.getElementById("totalCourses");
const activeCoursesEl = document.getElementById("activeCourses");
const avgCompletionEl = document.getElementById("avgCompletion");



// Load dashboard stats

async function loadDashboardStats() {
  try {
    // Fetch courses and analytics summary in parallel
    const [courseRes, summaryRes] = await Promise.all([
      fetch(`${BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${BASE_URL}/assessments/analytics-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const courses = await courseRes.json();
    const summary = await summaryRes.json();

    totalCoursesEl.textContent = courses.length;
    activeCoursesEl.textContent = courses.filter(c => c.isActive).length;
    avgCompletionEl.textContent = `${summary.avgCompletion ?? 0}%`;

  } catch (error) {
    console.log("Error loading stats:", error);
  }
}

// Logout

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

window.onload = loadDashboardStats;