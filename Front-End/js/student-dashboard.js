// for profile menu dropdown.
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener('click', (e) =>{

    if(!menu.contains(e.target)){
        dropdown.classList.remove("open");
    }

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

openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openModal();
});

closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);


form.addEventListener("submit", (e) => {
  e.preventDefault();

  const course = courseSelect.value;
  if (!course) return;

  // navigate with course in URL
  const url = `student-assessments.html?course=${encodeURIComponent(course)}`;
  window.location.href = url;
});
