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

const token = localStorage.getItem("token");
const coursesBody = document.getElementById("coursesBody");

// load enrolled courses
async function loadCourses() {
  const res = await fetch("http://localhost:8000/api/courses/enrolled", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const courses = await res.json();

  if (courses.length === 0) {
    coursesBody.innerHTML = `<tr><td colspan="5">No courses yet. Search and enroll below.</td></tr>`;
    return;
  }

  let html = "";
  courses.forEach(c => {
    html += `
      <tr data-id="${c._id}">
        <td>${c.courseCode}</td>
        <td>${c.name}</td>
        <td>${c.instructor}</td>
        <td>${c.term}</td>
        <td class="right">
          <button class="action-btn danger-btn unenroll-btn" type="button">Unenroll</button>
        </td>
      </tr>
    `;
  });
  coursesBody.innerHTML = html;
}

// unenroll
coursesBody.addEventListener("click", async function (e) {
  if (!e.target.classList.contains("unenroll-btn")) return;
  const row = e.target.closest("tr");
  const id = row.dataset.id;
  if (!confirm("Unenroll from this course?")) return;
  await fetch(`http://localhost:8000/api/courses/${id}/enroll`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadCourses();
});

// search and enroll
const addCourseBtn = document.getElementById("addCourseBtn");
const popup = document.getElementById("courseFormPopup");
const closeBtn = document.getElementById("closeCourseForm");
const cancelBtn = document.getElementById("cancelCourseForm");
const form = document.getElementById("addCourseForm");
const codeInput = form.querySelector('input[name="code"]');

addCourseBtn.addEventListener("click", () => popup.classList.remove("hidden"));
closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
cancelBtn.addEventListener("click", () => popup.classList.add("hidden"));

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const query = codeInput.value.trim();
  if (!query) return;

  // search for course
  const res = await fetch(`http://localhost:8000/api/courses/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const results = await res.json();

  if (results.length === 0) {
    alert("No course found with that code.");
    return;
  }

  // enroll in first match
  const course = results[0];
  const enrollRes = await fetch(`http://localhost:8000/api/courses/${course._id}/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await enrollRes.json();
  alert(data.message);
  popup.classList.add("hidden");
  form.reset();
  loadCourses();
});

loadCourses();