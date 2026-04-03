// profile dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

const openBtn = document.getElementById("openAssessments");
const modal = document.getElementById("coursePickerModal");
const closeBtn = document.getElementById("closeCoursePicker");
const cancelBtn = document.getElementById("cancelCoursePicker");
const form = document.getElementById("coursePickerForm");
const courseSelect = document.getElementById("courseSelect");

function openModal() {
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  form.reset();
}

openBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  // fetch real courses from backend
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:8000/api/courses", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const courses = await res.json();

  // clear and repopulate dropdown
  courseSelect.innerHTML = `<option value="">Choose a course...</option>`;
  courses.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c._id; // real MongoDB ID
    opt.textContent = `${c.code} — ${c.name}`;
    courseSelect.appendChild(opt);
  });

  openModal();
});

closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const course = courseSelect.value;
  if (!course) return;
  window.location.href = `student-assessments.html?course=${encodeURIComponent(course)}`;
});