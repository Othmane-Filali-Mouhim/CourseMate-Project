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

let allCourses = [];
let allAnalytics = {}; // { courseId: analyticsData }

// ----- FETCH -----
async function loadData() {
  const courseRes = await fetch(`${BASE_URL}/courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  allCourses = await courseRes.json();

  // Fetch analytics for each course in parallel
  await Promise.all(allCourses.map(async (course) => {
    const res = await fetch(`${BASE_URL}/assessments/analytics/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    allAnalytics[course._id] = data;
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

  const totalAssessments = list.reduce((sum, c) => {
    return sum + (allAnalytics[c._id]?.templateCount || 0);
  }, 0);

  // Overall avg: average of all courses that have an avgGrade
  const coursesWithAvg = list.filter(c => allAnalytics[c._id]?.avgGrade !== null);
  const overallAvg = coursesWithAvg.length === 0
    ? "--"
    : Math.round(
        coursesWithAvg.reduce((sum, c) => sum + allAnalytics[c._id].avgGrade, 0) /
        coursesWithAvg.length
      ) + "%";

  // Total unique students across filtered courses
  const totalStudents = list.reduce((sum, c) => {
    return sum + (allAnalytics[c._id]?.studentCount || 0);
  }, 0);

  summaryEl.innerHTML = `
    <div class="summary-card">
      <p class="label">Courses</p>
      <h2 class="value">${enabled}/${total}</h2>
      <p class="hint">Enabled / Total</p>
    </div>

    <div class="summary-card">
      <p class="label">Assessments</p>
      <h2 class="value">${totalAssessments}</h2>
      <p class="hint">Templates across selected courses</p>
    </div>

    <div class="summary-card">
      <p class="label">Overall Avg</p>
      <h2 class="value">${overallAvg}</h2>
      <p class="hint">Across all students with grades</p>
    </div>

    <div class="summary-card">
      <p class="label">Students</p>
      <h2 class="value">${totalStudents}</h2>
      <p class="hint">Active across selected courses</p>
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
    const a = allAnalytics[course._id];

    const completedPercent = a?.completedPercent ?? "--";
    const avgGrade = a?.avgGrade !== null && a?.avgGrade !== undefined
      ? `${a.avgGrade}%`
      : "--";
    const templateCount = a?.templateCount ?? 0;

    return `
      <tr>
        <td>${course.courseCode} — ${course.name}</td>
        <td>${course.isActive ? "Yes" : "No"}</td>
        <td>${templateCount}</td>
        <td>${completedPercent === "--" ? "--" : completedPercent + "%"}</td>
        <td>${avgGrade}</td>
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