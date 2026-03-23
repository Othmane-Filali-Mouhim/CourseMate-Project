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
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

// Modal elements
const modal = document.getElementById("courseModal");
const form = document.getElementById("courseForm");
const idInput = document.getElementById("courseIdInput");
const nameInput = document.getElementById("courseNameInput");
const termInput = document.getElementById("courseTermInput");

// OPEN modal
document.getElementById("addCourseBtn").addEventListener("click", () => {
  form.reset();
  modal.classList.add("show");
});

// CLOSE modal
document.getElementById("cancelBtn").addEventListener("click", () => {
  modal.classList.remove("show");
});

// SUBMIT - add course
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const editId = form.dataset.editId;

  const url = editId 
    ? `${BASE_URL}/${editId}`   // update
    : BASE_URL;                 // create

  const method = editId ? "PUT" : "POST";

  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      courseCode: idInput.value,
      name: nameInput.value,
      term: termInput.value
    })
  });

  const data = await response.json();

  if (response.ok) {
    alert(editId ? "Course updated!" : "Course created!");
    
    modal.classList.remove("show");
    form.reset();
    delete form.dataset.editId; // 🔥 IMPORTANT: reset mode

    await fetchCourses();
  } else {
    alert(data.message);
  }
});
let currentCourses = [];
// fetch all the courses
async function fetchCourses() {
  try {
    const response = await fetch(BASE_URL, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await response.json();
    console.log("Courses:", data);
    currentCourses = data;
    renderCourses(data);
  } catch (error) {
    console.log("Error fetching courses:", error);
  }
}
// RENDER courses on the page
function renderCourses(courses) {
  coursesList.innerHTML = "";

  if (!courses || courses.length === 0) {
    coursesList.innerHTML = "<p>No courses yet. Click 'Add Course' to get started!</p>";
    return;
  }

  courses.forEach(course => {
    const card = document.createElement("div");
    card.classList.add("course-card");
    card.innerHTML = `
      <div class="course-info">
        <h3>${course.courseCode} - ${course.name}</h3>
        <p>${course.term}</p>
        <p>Status: ${course.isActive ? "Enabled" : "Disabled"}</p>
      </div>
      <div class="course-actions">
        <button class="secondary-btn edit-btn" data-id="${course._id}" type="button">Edit</button>
        <button class="secondary-btn toggle-btn" data-id="${course._id}" type="button">
          ${course.isActive ? "Disable" : "Enable"}
        </button>
        <button class="danger-btn delete-btn" data-id="${course._id}" type="button">Delete</button>
      </div>
    `;
    coursesList.appendChild(card);
  });
}

document.addEventListener("click", async (e) => {

  //  EDIT
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;

    const course = currentCourses.find(c => c._id === id);
    if (!course) return;

    idInput.value = course.courseCode;
    nameInput.value = course.name;
    termInput.value = course.term;

    form.dataset.editId = id;

    modal.classList.add("show");
  }

  //  DELETE
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;

    const confirmDelete = confirm("Delete this course?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      await fetchCourses();

    } catch (error) {
      alert(error.message);
    }
  }

  // 🔁 TOGGLE ENABLE/DISABLE
  if (e.target.classList.contains("toggle-btn")) {
    const id = e.target.dataset.id;

    try {
      const response = await fetch(`${BASE_URL}/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      await fetchCourses();

    } catch (error) {
      alert(error.message);
    }
  }

});


function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

window.onload = fetchCourses;