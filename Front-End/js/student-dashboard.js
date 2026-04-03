const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

// ----- Profile dropdown -----
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

// ----- Assessment link -----
document.getElementById("openAssessments").addEventListener("click", () => {
  window.location.href = "student-assessments.html";
});

// ----- LOAD UPCOMING ASSESSMENTS -----
async function loadUpcoming() {
  try {
    // 1. get all enrolled courses
    const courseRes = await fetch(`${BASE_URL}/courses/enrolled`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const courses = await courseRes.json();

    if (!courses || courses.length === 0) {
      renderUpcoming([]);
      return;
    }

    // 2. for each course fetch student assessments
    const allUpcoming = [];

    await Promise.all(courses.map(async (course) => {
      const res = await fetch(`${BASE_URL}/assessments/student/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const assessments = data.studentAssessments || [];

      // 3. filter future due dates only
      const now = new Date();
      assessments.forEach(a => {
        if (a.dueDate && a.status !== "completed") {
  const isPast = new Date(a.dueDate) < now;

  allUpcoming.push({
    course: `${course.courseCode} — ${course.name}`,
    title: a.title,
    dueDate: a.dueDate,
    weight: a.weight,
    isPast 
  });
}
      });
    }));

    // 4. sort by closest due date
    allUpcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    renderUpcoming(allUpcoming);

  } catch (error) {
    console.error("ERROR:", error);
  }
}

// ----- RENDER -----
function renderUpcoming(list) {
  const table = document.querySelector(".dashboard-table");

  if (list.length === 0) {
    table.innerHTML = `
      <div class="dashboard-row dashboard-header-row">
        <span>Course</span>
        <span>Assessment</span>
        <span>Weight%</span>
        <span>Due Date</span>
      </div>
      <div class="dashboard-row">
        <span colspan="4">No upcoming assessments.</span>
      </div>
    `;
    return;
  }

  const rows = list.map(a => `
  <div class="dashboard-row ${a.isPast ? "past-due" : ""}">
    <span>${a.course}</span>
    <span>${a.title}</span>
    <span>${a.weight}%</span>
    <span>${new Date(a.dueDate).toLocaleDateString()}</span>
  </div>
`).join("");

  table.innerHTML = `
    <div class="dashboard-row dashboard-header-row">
      <span>Course</span>
      <span>Assessment</span>
      <span>Weight%</span>
      <span>Due Date</span>
    </div>
    ${rows}
  `;
}

// ----- INIT -----
loadUpcoming();