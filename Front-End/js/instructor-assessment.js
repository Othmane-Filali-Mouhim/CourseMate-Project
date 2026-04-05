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

// ----- GLOBAL STATE -----
let selectedCourse = null;
let categories = [];

// ----- DOM -----
const categoriesList = document.getElementById("categoriesList");
const modal = document.getElementById("categoryModal");
const form = document.getElementById("categoryForm");
const nameInput = document.getElementById("categoryNameInput");
const weightInput = document.getElementById("categoryWeightInput");
const dueDateInput = document.getElementById("categoryDueDateInput");
const editIdInput = document.getElementById("editCategoryId");
const totalWeightEl = document.getElementById("totalWeight");
const weightWarning = document.getElementById("weightWarning");
const modalTitle = document.getElementById("modalTitle");

// ----- LOAD COURSES -----
async function loadCourses() {
  try {
    const response = await fetch(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    const courseSelectList = document.getElementById("courseSelectList");

    if (!data || data.length === 0) {
      courseSelectList.innerHTML = "<p>No courses found</p>";
      return;
    }

    courseSelectList.innerHTML = "";

    data.forEach(course => {
      const btn = document.createElement("button");
      btn.classList.add("course-select-btn");
      btn.textContent = `${course.courseCode} — ${course.name}`;
      btn.onclick = () => selectCourse(course);
      courseSelectList.appendChild(btn);
    });

  } catch (error) {
    console.error("ERROR:", error);
    showNotif("Failed to load courses.", "error");
  }
}

// ----- SELECT COURSE -----
async function selectCourse(course) {
  try {
    selectedCourse = course;

    const response = await fetch(`${BASE_URL}/assessments/${course._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    categories = data;

    document.getElementById("courseSelectModal").classList.remove("show");
    document.getElementById("pageTitle").textContent =
      `Assessment Structure — ${course.courseCode} - ${course.name}`;

    renderCategories();
  } catch (error) {
    showNotif("Failed to load assessments.", "error");
  }
}

// ----- RENDER -----
function renderCategories() {
  categoriesList.innerHTML = "";

  if (categories.length === 0) {
    categoriesList.innerHTML = "<p>No assessments yet. Click 'Add Category' to get started!</p>";
    updateTotalWeight();
    return;
  }

  categories.forEach(cat => {
    const card = document.createElement("div");
    card.classList.add("category-card");

    card.innerHTML = `
      <div>
        <h4>${cat.title}</h4>
        <p>${cat.weight}%</p>
        <p>Due: ${cat.dueDate ? new Date(cat.dueDate).toLocaleDateString() : "No due date"}</p>
      </div>
      <div>
        <button class="edit-btn" data-id="${cat._id}">Edit</button>
        <button class="delete-btn" data-id="${cat._id}">Delete</button>
      </div>
    `;

    categoriesList.appendChild(card);
  });

  updateTotalWeight();
}

// ----- WEIGHT CHECK -----
function updateTotalWeight() {
  const total = categories.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  totalWeightEl.textContent = total;

  if (total !== 100) {
    weightWarning.textContent = "⚠ Total must be 100%";
    weightWarning.style.color = "red";
  } else {
    weightWarning.textContent = "✔ Total weight is valid";
    weightWarning.style.color = "green";
  }
}

// ----- MODAL -----
function openModalForAdd() {
  if (!selectedCourse) {
    showNotif("Select a course first", "warning");
    return;
  }

  modalTitle.textContent = "Add Category";
  form.reset();
  editIdInput.value = "";
  modal.classList.add("show");
}

function openModalForEdit(cat) {
  modalTitle.textContent = "Edit Category";
  editIdInput.value = cat._id;
  nameInput.value = cat.title;
  weightInput.value = cat.weight;
  dueDateInput.value = cat.dueDate ? cat.dueDate.split("T")[0] : "";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

// ----- EVENTS -----
document.getElementById("addCategoryBtn").addEventListener("click", openModalForAdd);
document.getElementById("cancelBtn").addEventListener("click", closeModal);

// change course button
document.getElementById("changeCourseBtn").addEventListener("click", () => {
  document.getElementById("courseSelectModal").classList.add("show");
});

// SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const editId = editIdInput.value;
  const title = nameInput.value.trim();
  const weight = Number(weightInput.value);
  const dueDate = dueDateInput.value;

  try {
    if (editId) {
      const response = await fetch(`${BASE_URL}/assessments/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, weight, dueDate })
      });

      const updated = await response.json();

      if (!response.ok) {
        showNotif(updated.message || "Failed to update assessment.", "error");
        return;
      }

      categories = categories.map(cat => cat._id === editId ? updated : cat);
      showNotif("Assessment updated successfully.", "success");

    } else {
      const response = await fetch(`${BASE_URL}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          title,
          weight,
          dueDate,
          category: "assignment",
          totalMarks: 100,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showNotif(data.message || "Failed to create assessment.", "error");
        return;
      }

      categories.push(data.assessment);
      showNotif("Assessment created successfully.", "success");
    }

    closeModal();
    renderCategories();

  } catch (error) {
    showNotif("Server error while saving assessment.", "error");
  }
});

// EDIT / DELETE
categoriesList.addEventListener("click", (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("edit-btn")) {
    const cat = categories.find(c => c._id === id);
    if (cat) openModalForEdit(cat);
  }

  if (e.target.classList.contains("delete-btn")) {
    showConfirm("Delete this assessment?", () => {
      deleteAssessment(id);
    });
  }
});

async function deleteAssessment(id) {
  try {
    const response = await fetch(`${BASE_URL}/assessments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      showNotif(data.message || "Failed to delete assessment.", "error");
      return;
    }

    categories = categories.filter(c => c._id !== id);
    renderCategories();
    showNotif("Assessment deleted successfully.", "success");

  } catch (error) {
    showNotif("Server error while deleting assessment.", "error");
  }
}

// ----- INIT -----
loadCourses();