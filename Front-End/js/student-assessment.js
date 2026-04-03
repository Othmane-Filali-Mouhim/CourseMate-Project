// Student Assessments Page

// Profile dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

// ----- Get selected course -----
const params = new URLSearchParams(window.location.search);
const courseId = params.get("course");
let selectedCourse = null;

for (let i = 0; i < courses.length; i++) {
  if (courses[i].id === courseId) {
    selectedCourse = courses[i];
    break;
  }
}

const courseTitleEl = document.getElementById("courseTitle");
const assessmentRowsEl = document.getElementById("assessmentRows");
const avgValueEl = document.getElementById("avgValue");
const progressBarEl = document.getElementById("progressBar");
const progressTextEl = document.getElementById("progressText");

if (selectedCourse) {
  courseTitleEl.textContent = selectedCourse.code + " — " + selectedCourse.name;
} else {
  courseTitleEl.textContent = "No course selected";
}


// ----- Selection -----
let selectedAssessmentId = "";

// ----- Modal (your current HTML structure) -----
const addAssessmentBtn = document.getElementById("btnAddAssessment");
const editAssessmentBtn = document.getElementById("btnEditAssessment");
const popup = document.getElementById("assessmentFormPopup");
const form = document.getElementById("btnAddAssessmentForm");
const cancelBtn = document.getElementById("cancelCourseForm");

const modalTitleEl = popup.querySelector("h3");
const formInputs = form.querySelectorAll("input");
const statusSelect = form.querySelector("select");

// inputs by order in your HTML:
// 0: name (text)
// 1: due (date)
// 2: grade (text)
// 3: weight (text)
const nameInput = formInputs[0];
const dueInput = formInputs[1];
const gradeInput = formInputs[2];
const weightInput = formInputs[3];

let editingId = "";

// Helpers
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function computeCourseAverage(course) {
  let sum = 0;
  let sumW = 0;

  for (let i = 0; i < course.assessments.length; i++) {
    const a = course.assessments[i];

    if (typeof a.gradePct === "number" && !Number.isNaN(a.gradePct)) {
      if (typeof a.weightPct === "number" && !Number.isNaN(a.weightPct)) {
        sum += a.gradePct * a.weightPct;
        sumW += a.weightPct;
      }
    }
  }

  if (sumW === 0) return null;
  return sum / sumW;
}

function computeCourseProgress(course) {
  const total = course.assessments.length;
  let completed = 0;

  for (let i = 0; i < total; i++) {
    if (course.assessments[i].completed) completed++;
  }

  let percent = 0;
  if (total > 0) percent = Math.round((completed / total) * 100);

  return { completed: completed, total: total, percent: percent };
}

// Render
function renderStats() {
 

  const avg = computeCourseAverage(selectedCourse);
  if (avg === null) avgValueEl.textContent = "--%";
  else avgValueEl.textContent = String(Math.round(avg)) + "%";

  const prog = computeCourseProgress(selectedCourse);
  progressBarEl.style.width = String(prog.percent) + "%";
  progressTextEl.textContent = String(prog.completed) + "/" + String(prog.total);
}

function renderTable() {
  
  const list = selectedCourse.assessments;

  if (list.length === 0) {
    assessmentRowsEl.innerHTML = `
      <tr>
        <td colspan="5">No assessments yet. Click “+ Add Assessment”.</td>
      </tr>
    `;
    return;
  }

  let html = "";

  for (let i = 0; i < list.length; i++) {
    const a = list[i];

    let statusText = "Pending";
    if (a.completed) statusText = "Completed";

    let checkedAttr = "";
    if (a.completed) checkedAttr = "checked";

    let gradeText = "";
    if (typeof a.gradePct === "number") gradeText = String(a.gradePct);

    let weightText = "";
    if (a.weightPct !== null && a.weightPct !== undefined) weightText = String(a.weightPct);

    let rowClass = "";
    if (a.id === selectedAssessmentId) rowClass = "selected-row";

    html += `
      <tr data-id="${a.id}" class="${rowClass}">
        <td>${a.name}</td>
        <td>${formatDate(a.due)}</td>
        <td>${gradeText}</td>
        <td>${weightText}</td>
        <td class="right">
          <label class="status-inline">
            <input type="checkbox" class="complete-toggle" data-id="${a.id}" ${checkedAttr} />
            <span>${statusText}</span>
          </label>
          <button type="button" class="icon-btn edit-btn" data-id="${a.id}">Edit</button>
          <button type="button" class="icon-btn danger delete-btn" data-id="${a.id}">Del</button>
        </td>
      </tr>
    `;
  }

  assessmentRowsEl.innerHTML = html;
}

function rerender() {
  renderTable();
  renderStats();
}

// Modal open/close
function openFormAdd() {
  editingId = "";
  modalTitleEl.textContent = "Add assessment";
  form.reset();
  popup.classList.remove("hidden");
}

function openFormEdit(assessment) {
  editingId = assessment.id;
  modalTitleEl.textContent = "Edit assessment";

  nameInput.value = assessment.name;
  dueInput.value = assessment.due;

  if (typeof assessment.gradePct === "number") gradeInput.value = String(assessment.gradePct);
  else gradeInput.value = "";

  if (assessment.weightPct !== null && assessment.weightPct !== undefined) weightInput.value = String(assessment.weightPct);
  else weightInput.value = "";

  if (assessment.completed) statusSelect.value = "Completed";
  else statusSelect.value = "Pending";

  popup.classList.remove("hidden");
}

function closeForm() {
  popup.classList.add("hidden");
  form.reset();
  editingId = "";
}

// Buttons
addAssessmentBtn.addEventListener("click", () => {
  if (!selectedCourse) {
    alert("Select a course first.");
    return;
  }
  openFormAdd();
});

editAssessmentBtn.addEventListener("click", () => {
  if (!selectedCourse) {
    alert("Select a course first.");
    return;
  }
  if (!selectedAssessmentId) {
    alert("Click a row first to select an assessment, then press Edit.");
    return;
  }

  let found = null;
  for (let i = 0; i < selectedCourse.assessments.length; i++) {
    if (selectedCourse.assessments[i].id === selectedAssessmentId) {
      found = selectedCourse.assessments[i];
      break;
    }
  }

  if (!found) {
    alert("Assessment not found.");
    return;
  }

  openFormEdit(found);
});

cancelBtn.addEventListener("click", closeForm);

// Save (Add/Edit)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedCourse) return;

  const name = nameInput.value.trim();
  const due = dueInput.value;

  const weightPct = Number(weightInput.value);
  const gradeRaw = gradeInput.value;

  let gradePct = null;
  if (gradeRaw !== "") {
    gradePct = Number(gradeRaw);
    if (Number.isNaN(gradePct)) gradePct = null;
  }

  const completed = statusSelect.value === "Completed";

  if (!name || !due || Number.isNaN(weightPct)) return;

  if (editingId) {
    for (let i = 0; i < selectedCourse.assessments.length; i++) {
      if (selectedCourse.assessments[i].id === editingId) {
        selectedCourse.assessments[i].name = name;
        selectedCourse.assessments[i].due = due;
        selectedCourse.assessments[i].weightPct = weightPct;
        selectedCourse.assessments[i].completed = completed;
        selectedCourse.assessments[i].gradePct = gradePct;
        break;
      }
    }
  } else {
    const newId = "A_" + String(Date.now());
    selectedCourse.assessments.push({
      id: newId,
      name: name,
      due: due,
      weightPct: weightPct,
      gradePct: gradePct,
      completed: completed
    });
  }

  closeForm();
  rerender();
});

// Table interactions
assessmentRowsEl.addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  if (row && row.dataset.id) {
    selectedAssessmentId = row.dataset.id;
    rerender();
  }

  const toggle = e.target.closest(".complete-toggle");
  if (toggle && selectedCourse) {
    const id = toggle.dataset.id;
    const checked = toggle.checked;

    for (let i = 0; i < selectedCourse.assessments.length; i++) {
      if (selectedCourse.assessments[i].id === id) {
        selectedCourse.assessments[i].completed = checked;
        break;
      }
    }

    rerender();
    return;
  }

  const editBtn = e.target.closest(".edit-btn");
  if (editBtn && selectedCourse) {
    const id = editBtn.dataset.id;

    let found = null;
    for (let i = 0; i < selectedCourse.assessments.length; i++) {
      if (selectedCourse.assessments[i].id === id) {
        found = selectedCourse.assessments[i];
        break;
      }
    }

    if (found) {
      selectedAssessmentId = id;
      openFormEdit(found);
      rerender();
    }
    return;
  }

  const delBtn = e.target.closest(".delete-btn");
  if (delBtn && selectedCourse) {
    const id = delBtn.dataset.id;
    const ok = confirm("Delete this assessment? (Demo action)");
    if (!ok) return;

    const next = [];
    for (let i = 0; i < selectedCourse.assessments.length; i++) {
      if (selectedCourse.assessments[i].id !== id) next.push(selectedCourse.assessments[i]);
    }
    selectedCourse.assessments = next;

    if (selectedAssessmentId === id) selectedAssessmentId = "";
    rerender();
  }
});

rerender();