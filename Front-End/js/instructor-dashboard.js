// Auth + API
const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api/courses";

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
    const response = await fetch(BASE_URL, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const courses = await response.json();

    // Total courses
    const total = courses.length;

    //Active courses
    const active = courses.filter(c => c.isActive).length;

    // Avg completion
    let avg = 0;

    if (courses.length > 0) {
      
      const sum = courses.reduce((acc, c) => {
        return acc + (c.completionPercentage ?? Math.floor(Math.random() * 100));
      }, 0);

      avg = Math.round(sum / courses.length);
    }

    // Update UI
    totalCoursesEl.textContent = total;
    activeCoursesEl.textContent = active;
    avgCompletionEl.textContent = avg + "%";

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