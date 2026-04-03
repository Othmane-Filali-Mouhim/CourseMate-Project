const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

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

const filterSelect = document.getElementById("courseFilter");
const summaryEl = document.getElementById("analyticsSummary");
const rowsEl = document.getElementById("courseStatsRows");


//store the course in array
let allCourses = [];
let allAssessments = {}; // store { courseId: [assessments] }

// ----- FETCH -----
async function loadData() {
  // 1. fetch all courses
  const courseRes = await fetch(`${BASE_URL}/courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  allCourses = await courseRes.json();

  // 2. fetch assessments for each course
  await Promise.all(allCourses.map(async (course) => {
    const res = await fetch(`${BASE_URL}/assessments/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    allAssessments[course._id] = data;
  }));

  renderFilterOptions();
  renderSummary();
  renderTable();
}

// ----- FILTER -----
function getFilteredCourses() {
  const v = filterSelect?.value || "all";
  if (v === "all") return allCourses;
  return allCourses.filter(c => c._id === v);
}

// ----- FILTER OPTIONS -----
function renderFilterOptions() {
  filterSelect.innerHTML = '<option value="all">All courses</option>';
  allCourses.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c._id;
    opt.textContent = `${c.courseCode} — ${c.name}`;
    filterSelect.appendChild(opt);
  });
}

// ----- SUMMARY CARDS -----
function renderSummary() {
  const list = getFilteredCourses();
  const enabled = list.filter(c => c.isActive).length;
  const total = list.length;

  const allAssessmentsFlat = list.flatMap(c => allAssessments[c._id] || []);
  const assessmentCount = allAssessmentsFlat.length;

  summaryEl.innerHTML = `
    <div class="summary-card">
      <p class="label">Courses</p>
      <h2 class="value">${enabled}/${total}</h2>
      <p class="hint">Enabled / Total</p>
    </div>

    <div class="summary-card">
      <p class="label">Assessments</p>
      <h2 class="value">${assessmentCount}</h2>
      <p class="hint">Across selected courses</p>
    </div>

    <div class="summary-card">
      <p class="label">Overall Avg</p>
      <h2 class="value">--</h2>
      <p class="hint">Available once students enroll</p>
    </div>
  `;
}

// ----- TABLE -----
function renderTable() {
  const list = getFilteredCourses();

  if (list.length === 0) {
    rowsEl.innerHTML = `<tr><td colspan="5">No courses found.</td></tr>`;
    return;
  }

  rowsEl.innerHTML = list.map(course => {
    const assessments = allAssessments[course._id] || [];
    return `
      <tr>
        <td>${course.courseCode} — ${course.name}</td>
        <td>${course.isActive ? "Yes" : "No"}</td>
        <td>${assessments.length}</td>
        <td>--</td>
        <td>--</td>
      </tr>
    `;
  }).join("");
}

// ----- FILTER CHANGE -----
filterSelect?.addEventListener("change", () => {
  renderSummary();
  renderTable();
});

// ----- INIT -----
loadData();