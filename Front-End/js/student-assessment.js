// profile dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");
menu.addEventListener("click", (e) => { dropdown.classList.toggle("open"); e.stopPropagation(); });
document.addEventListener("click", (e) => { if (!menu.contains(e.target)) dropdown.classList.remove("open"); });

const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const courseId = params.get("course");

const courseTitleEl = document.getElementById("courseTitle");
const assessmentRowsEl = document.getElementById("assessmentRows");
const avgValueEl = document.getElementById("avgValue");
const progressBarEl = document.getElementById("progressBar");
const progressTextEl = document.getElementById("progressText");
const popup = document.getElementById("assessmentFormPopup");
const form = document.getElementById("btnAddAssessmentForm");
const cancelBtn = document.getElementById("cancelCourseForm");
const formInputs = form.querySelectorAll("input");
const statusSelect = form.querySelector("select");
const nameInput = formInputs[0];
const dueInput = formInputs[1];
const gradeInput = formInputs[2];
const weightInput = formInputs[3];

let editingId = "";
let assessments = [];

// load course title
async function loadCourseTitle() {
  if (!courseId) { courseTitleEl.textContent = "No course selected"; return; }
  const res = await fetch(`http://localhost:8000/api/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const course = await res.json();
  courseTitleEl.textContent = `${course.courseCode} — ${course.name}`;
}

// load assessments from backend
async function loadAssessments() {
  if (!courseId) return;
  const res = await fetch(`http://localhost:8000/api/assessments/student/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  assessments = data.studentAssessments || [];
  renderTable();
  renderStats();
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderStats() {
  let sum = 0, sumW = 0, completed = 0;
  assessments.forEach(a => {
    if (a.earnedMarks && a.totalMarks) {
      const pct = (a.earnedMarks / a.totalMarks) * 100;
      sum += pct * a.weight;
      sumW += a.weight;
    }
    if (a.status === "completed") completed++;
  });
  avgValueEl.textContent = sumW === 0 ? "--%" : Math.round(sum / sumW) + "%";
  const total = assessments.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBarEl.style.width = pct + "%";
  progressTextEl.textContent = `${completed}/${total}`;
}

function renderTable() {
  if (assessments.length === 0) {
    assessmentRowsEl.innerHTML = `<tr><td colspan="5">No assessments yet. Click "+ Add Assessment".</td></tr>`;
    return;
  }
  let html = "";
  assessments.forEach(a => {
    const grade = a.totalMarks ? Math.round((a.earnedMarks / a.totalMarks) * 100) + "%" : "—";
    const checked = a.status === "completed" ? "checked" : "";
    html += `
      <tr data-id="${a._id}">
        <td>${a.title}</td>
        <td>${formatDate(a.dueDate)}</td>
        <td>${grade}</td>
        <td>${a.weight}%</td>
        <td class="right">
          <label class="status-inline">
            <input type="checkbox" class="complete-toggle" data-id="${a._id}" ${checked}/>
            <span>${a.status}</span>
          </label>
          <button type="button" class="icon-btn edit-btn" data-id="${a._id}">Edit</button>
          <button type="button" class="icon-btn danger delete-btn" data-id="${a._id}">Del</button>
        </td>
      </tr>`;
  });
  assessmentRowsEl.innerHTML = html;
}

// open/close form
document.getElementById("btnAddAssessment").addEventListener("click", () => {
  editingId = "";
  form.reset();
  popup.classList.remove("hidden");
});
cancelBtn.addEventListener("click", () => { popup.classList.add("hidden"); form.reset(); editingId = ""; });

// save assessment
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = nameInput.value.trim();
  const dueDate = dueInput.value;
  const earnedMarks = Number(gradeInput.value);
  const weight = Number(weightInput.value);
  const status = statusSelect.value.toLowerCase();

  if (editingId) {
    await fetch(`http://localhost:8000/api/assessments/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, dueDate, earnedMarks, weight, status })
    });
  } else {
    await fetch("http://localhost:8000/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId, title, weight, dueDate, earnedMarks, status })
    });
  }

  popup.classList.add("hidden");
  form.reset();
  editingId = "";
  loadAssessments();
});

// table interactions
assessmentRowsEl.addEventListener("click", async (e) => {
  const toggle = e.target.closest(".complete-toggle");
  if (toggle) {
    const id = toggle.dataset.id;
    const status = toggle.checked ? "completed" : "pending";
    await fetch(`http://localhost:8000/api/assessments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    loadAssessments();
    return;
  }

  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    const id = editBtn.dataset.id;
    const a = assessments.find(x => x._id === id);
    if (!a) return;
    editingId = id;
    nameInput.value = a.title;
    dueInput.value = a.dueDate ? a.dueDate.substring(0, 10) : "";
    gradeInput.value = a.earnedMarks;
    weightInput.value = a.weight;
    statusSelect.value = a.status === "completed" ? "Completed" : "Pending";
    popup.classList.remove("hidden");
    return;
  }

  const delBtn = e.target.closest(".delete-btn");
  if (delBtn) {
    if (!confirm("Delete this assessment?")) return;
    await fetch(`http://localhost:8000/api/assessments/${delBtn.dataset.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadAssessments();
  }
});

// export
async function exportGrades(format) {
  if (!courseId) { alert("No course selected."); return; }
  const res = await fetch(`http://localhost:8000/api/assessments/export/${courseId}?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grades.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btnExportPDF").addEventListener("click", () => exportGrades("pdf"));
document.getElementById("btnExportCSV").addEventListener("click", () => exportGrades("csv"));

loadCourseTitle();
loadAssessments();