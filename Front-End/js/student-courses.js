const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

let enrolledCourses = [];

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
const addCourseBtn = document.getElementById("addCourseBtn");
const popup = document.getElementById("courseFormPopup");
const closeBtn = document.getElementById("closeCourseForm");
const cancelBtn = document.getElementById("cancelCourseForm");
const coursesBody = document.getElementById("coursesBody");
const form = document.getElementById("addCourseForm");

// ----- OPEN / CLOSE popup -----
addCourseBtn.addEventListener("click", () => popup.classList.remove("hidden"));
closeBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  form.reset();
});
cancelBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  form.reset();
});

// ----- SUBMIT - find and enroll -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = form.querySelector('input[name="code"]').value.trim();
  const name = form.querySelector('input[name="name"]').value.trim();
  const term = form.querySelector('select[name="term"]').value;

  // search DB for matching course
  const res = await fetch(`${BASE_URL}/courses/search?q=${code}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const results = await res.json();

  // find exact match by code AND name AND term
  const match = results.find(c =>
    c.courseCode.toLowerCase() === code.toLowerCase() &&
    c.name.toLowerCase() === name.toLowerCase()
  );

  if (!match) {
  showNotif("No course found matching that code, name, and term.", "error");    return;
  }

  if (enrolledCourses.some(c => c._id === match._id)) {
    showNotif("You are already enrolled in this course.", "warning");
    return;
  }

  // enroll
  const enrollRes = await fetch(`${BASE_URL}/courses/${match._id}/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await enrollRes.json();

  if (enrollRes.ok) {
    alert("Successfully enrolled!");
    popup.classList.add("hidden");
    form.reset();
    await fetchEnrolledCourses();
  } else {
    alert(data.message);
  }
});

// ----- FETCH ENROLLED COURSES -----
async function fetchEnrolledCourses() {
  const res = await fetch(`${BASE_URL}/courses/enrolled`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  enrolledCourses = await res.json();
  renderCourses();
}

// ----- RENDER TABLE -----
function renderCourses() {
  if (!enrolledCourses || enrolledCourses.length === 0) {
    coursesBody.innerHTML = `<tr><td colspan="4">No courses yet. Click '+ Add Course' to get started!</td></tr>`;
    return;
  }

  coursesBody.innerHTML = enrolledCourses.map(c => `
    <tr data-id="${c._id}">
      <td>${c.courseCode}</td>
      <td>${c.name}</td>
      <td>${c.term}</td>
      <td class="right">
        <button class="action-btn open-btn" data-id="${c._id}">Open</button>
        <button class="action-btn danger-btn remove-btn" data-id="${c._id}">Remove</button>
      </td>
    </tr>
  `).join("");
}

// ----- TABLE ACTIONS -----
coursesBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("remove-btn")) {
    const ok = confirm("Remove this course?");
    if (!ok) return;

    const res = await fetch(`${BASE_URL}/courses/${id}/enroll`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) await fetchEnrolledCourses();
  }

  if (e.target.classList.contains("open-btn")) {
    window.location.href = `student-assessments.html?courseId=${id}`;
  }
});

// ----- INIT -----
fetchEnrolledCourses();