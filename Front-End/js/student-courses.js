// for profile menu dropdown.
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

// for add course popmenu
const addCourseBtn = document.getElementById("addCourseBtn");
const popup = document.getElementById("courseFormPopup");
const closeBtn = document.getElementById("closeCourseForm");
const cancelBtn = document.getElementById("cancelCourseForm");

const form = document.getElementById("addCourseForm");
const codeInput = form.querySelector('input[name="code"]');
const nameInput = form.querySelector('input[name="name"]');
const instructorInput = form.querySelector('input[name="instructor"]');
const termSelect = form.querySelector('select[name="term"]');
const modalTitle = popup.querySelector("h2");

let editingCourseId = "";

function openFormAdd() {
  editingCourseId = "";
  modalTitle.textContent = "Add a Course";
  form.reset();
  popup.classList.remove("hidden");
}

function openFormEdit(course) {
  editingCourseId = course.id;
  modalTitle.textContent = "Edit Course";

  codeInput.value = course.code;
  nameInput.value = course.name;
  instructorInput.value = course.instructor;
  termSelect.value = course.term;

  popup.classList.remove("hidden");
}

function closeForm() {
  popup.classList.add("hidden");
  form.reset();
  editingCourseId = "";
}

addCourseBtn.addEventListener("click", openFormAdd);
closeBtn.addEventListener("click", closeForm);
cancelBtn.addEventListener("click", closeForm);

// render courses
const coursesBody = document.getElementById("coursesBody");

function renderCourses() {
  let html = "";

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];

    html += `
      <tr data-id="${c.id}">
        <td>${c.code}</td>
        <td>${c.name}</td>
        <td>${c.instructor}</td>
        <td>${c.term}</td>
        <td class="right">
          <button class="action-btn edit-btn" type="button">Edit</button>
          <button class="action-btn danger-btn delete-btn" type="button">Delete</button>
        </td>
      </tr>
    `;
  }

  coursesBody.innerHTML = html;
}

// SAVE (Add/Edit) using the same modal
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  const instructor = instructorInput.value.trim();
  const term = termSelect.value;

  if (!code || !name || !instructor || !term) return;

  if (editingCourseId) {
    // EDIT mode
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].id === editingCourseId) {
        courses[i].code = code;
        courses[i].name = name;
        courses[i].instructor = instructor;
        courses[i].term = term;
        break;
      }
    }
  } else {
    // ADD mode
    courses.push({
      id: "C_" + Date.now(),
      code: code,
      name: name,
      instructor: instructor,
      term: term,
      assessments: []
    });
  }

  closeForm();
  renderCourses();
});

// table actions (Delete + Edit)
coursesBody.addEventListener("click", function (e) {
  const row = e.target.closest("tr");
  if (!row) return;

  const id = row.dataset.id;

  // DELETE
  if (e.target.classList.contains("delete-btn")) {
    const ok = confirm("Delete this course?");
    if (!ok) return;

    for (let i = 0; i < courses.length; i++) {
      if (courses[i].id === id) {
        courses.splice(i, 1);
        break;
      }
    }

    renderCourses();
    return;
  }

  // EDIT (open modal and prefill)
  if (e.target.classList.contains("edit-btn")) {
    let course = null;

    for (let i = 0; i < courses.length; i++) {
      if (courses[i].id === id) {
        course = courses[i];
        break;
      }
    }

    if (!course) return;

    openFormEdit(course);
  }
});

renderCourses();