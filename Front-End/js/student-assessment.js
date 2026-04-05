const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

const params = new URLSearchParams(window.location.search);
let courseId = params.get("courseId");

let studentAssessments = [];
let templates = [];
let stats = null;
let currentCourse = null;

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

// ----- DOM -----
const courseTitle = document.getElementById("courseTitle");
const assessmentRows = document.getElementById("assessmentRows");
const templateRows = document.getElementById("templateRows");
const popup = document.getElementById("assessmentFormPopup");
const form = document.getElementById("btnAddAssessmentForm");
const cancelBtn = document.getElementById("cancelCourseForm");
const addBtn = document.getElementById("btnAddAssessment");
const modalTitle = document.getElementById("modalTitle");
const courseSelectModal = document.getElementById("courseSelectModal");
const courseSelectList = document.getElementById("courseSelectList");

const nameInput = form.querySelector('input[name="aname"]');
const dueInput = form.querySelector('input[name="due"]');
const gradeInput = form.querySelector('input[name="grade"]');
const weightInput = form.querySelector('input[name="weight"]');
const statusSelect = form.querySelector('select[name="status"]');

let editingId = "";

// ----- LOAD DATA -----
async function loadData() {
  const courseRes = await fetch(`${BASE_URL}/courses/enrolled`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const courses = await courseRes.json();

  courseSelectList.innerHTML = "";

  if (!courses || courses.length === 0) {
    courseSelectList.innerHTML = "<p>No enrolled courses found.</p>";
    return;
  }

  courses.forEach((course) => {
    const btn = document.createElement("button");
    btn.classList.add("course-select-btn");
    btn.textContent = `${course.courseCode} — ${course.name}`;

    btn.onclick = () => {
      courseId = course._id;
      window.history.pushState({}, "", `?courseId=${course._id}`);
      courseSelectModal.classList.remove("show");
      loadCourseData(course);
    };

    courseSelectList.appendChild(btn);
  });

  if (courseId) {
    const course = courses.find((c) => c._id === courseId);
    if (course) {
      courseSelectModal.classList.remove("show");
      loadCourseData(course);
    }
  }
}

async function loadCourseData(course) {
  currentCourse = course;
  courseTitle.textContent = `${course.courseCode} — ${course.name}`;

  const res = await fetch(`${BASE_URL}/assessments/student/${course._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
  showNotif(data.message || "Failed to load assessments.", "error");
  return;
}

  templates = data.templates || [];
  studentAssessments = data.studentAssessments || [];
  stats = data.stats || null;

  renderAll();
}

async function refreshCurrentCourse() {
  if (!currentCourse) return;
  await loadCourseData(currentCourse);
}

// ----- RENDER -----
function renderAll() {
  renderTemplates();
  renderStudentAssessments();
  renderStats();
}

function renderTemplates() {
  if (templates.length === 0) {
    templateRows.innerHTML = `<tr><td colspan="4">No templates from instructor yet.</td></tr>`;
    return;
  }

  templateRows.innerHTML = templates.map((t) => `
    <tr>
      <td>${t.title}</td>
      <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
      <td>${t.weight}%</td>
      <td class="right">
        <button class="action-btn use-template-btn" data-id="${t._id}">Use Template</button>
      </td>
    </tr>
  `).join("");
}

function renderStudentAssessments() {
  if (studentAssessments.length === 0) {
    assessmentRows.innerHTML = `<tr><td colspan="5">No assessments yet. Add one or use a template.</td></tr>`;
    return;
  }

  assessmentRows.innerHTML = studentAssessments.map((a) => `
    <tr>
      <td>${a.title}</td>
      <td>${a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td>
      <td>${a.earnedMarks !== null && a.earnedMarks !== undefined ? a.earnedMarks + "%" : "—"}</td>
      <td>${a.weight}%</td>
      <td class="right">
        <select class="status-select" data-id="${a._id}">
          <option value="pending" ${a.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="completed" ${a.status === "completed" ? "selected" : ""}>Completed</option>
        </select>
        <button class="action-btn edit-btn" data-id="${a._id}">Edit</button>
        <button class="action-btn danger-btn delete-btn" data-id="${a._id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderStats() {
  const avgEl = document.getElementById("avgValue");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  if (!stats) {
    avgEl.textContent = "--%";
    progressBar.style.width = "0%";
    progressText.textContent = "0/0";
    return;
  }

  avgEl.textContent = stats.average === null ? "--%" : `${stats.average}%`;
  progressBar.style.width = `${stats.progressPercent}%`;
  progressText.textContent = `${stats.completed}/${stats.total}`;
}

// ----- CHANGE COURSE -----
document.getElementById("changeCourseBtn").addEventListener("click", () => {
  courseSelectModal.classList.add("show");
});

// ----- OPEN / CLOSE MODAL -----
addBtn.addEventListener("click", () => {
 if (!courseId) {
  showNotif("Please select a course first.", "warning");
  return;
}

  editingId = "";
  modalTitle.textContent = "Add Assessment";
  form.reset();
  popup.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  form.reset();
  editingId = "";
});

// ----- SUBMIT -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    courseId,
    title: nameInput.value.trim(),
    dueDate: dueInput.value,
    earnedMarks: gradeInput.value === "" ? null : Number(gradeInput.value),
    weight: Number(weightInput.value),
    status: statusSelect.value,
    category: "assignment",
    totalMarks: 100,
    isTemplate: false
  };

  if (editingId) {
    const res = await fetch(`${BASE_URL}/assessments/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
  showNotif(data.message || "Failed to update assessment.", "error");
  return;
}
  showNotif("Assessment updated successfully", "success");
  } else {
    const res = await fetch(`${BASE_URL}/assessments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
  showNotif(data.message || "Failed to create assessment.", "error");
  return;
}

showNotif("Assessment created successfully", "success");
  }

  popup.classList.add("hidden");
  form.reset();
  editingId = "";
  await refreshCurrentCourse();
});

// ----- TABLE ACTIONS -----
assessmentRows.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("edit-btn")) {
    const a = studentAssessments.find((a) => a._id === id);
    if (!a) return;

    editingId = id;
    modalTitle.textContent = "Edit Assessment";
    nameInput.value = a.title;
    dueInput.value = a.dueDate ? a.dueDate.split("T")[0] : "";
    gradeInput.value = a.earnedMarks ?? "";
    weightInput.value = a.weight;
    statusSelect.value = a.status;
    popup.classList.remove("hidden");
  }

  if (e.target.classList.contains("delete-btn")) {
  showConfirm("Delete this assessment?", async () => {
    const res = await fetch(`${BASE_URL}/assessments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      showNotif(data.message || "Failed to delete assessment.", "error");
      return;
    }

    showNotif("Assessment deleted", "success");
    await refreshCurrentCourse();
  });
}
});

// ----- STATUS CHANGE -----
assessmentRows.addEventListener("change", async (e) => {
  if (e.target.classList.contains("status-select")) {
    const id = e.target.dataset.id;

    const res = await fetch(`${BASE_URL}/assessments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: e.target.value })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to update status.");
      return;
    }

    await refreshCurrentCourse();
  }
});

// ----- USE TEMPLATE -----
templateRows.addEventListener("click", async (e) => {
  if (e.target.classList.contains("use-template-btn")) {
    const id = e.target.dataset.id;

    const res = await fetch(`${BASE_URL}/assessments/copy/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to use template.");
      return;
    }

    await refreshCurrentCourse();
  }
});
// ----- EXPORT -----
async function exportGrades(format) {
  if (!courseId) {
    alert("Please select a course first.");
    return;
  }

  const res = await fetch(
    `${BASE_URL}/assessments/export/${courseId}?format=${format}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Export failed:", text);
    alert("Failed to export grades.");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `grades.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

const exportPdfBtn = document.getElementById("btnExportPDF");
const exportCsvBtn = document.getElementById("btnExportCSV");

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", () => exportGrades("pdf"));
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => exportGrades("csv"));
}

// ----- INIT -----
loadData();