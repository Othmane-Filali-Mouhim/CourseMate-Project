// dropdown
const menu = document.querySelector(".profile-menu");
const dropdown = document.querySelector(".profile-dropdown");

menu.addEventListener("click", (e) => {
  dropdown.classList.toggle("open");
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) dropdown.classList.remove("open");
});

// fill profile info
document.getElementById("nameText").textContent = currentUser.name;
document.getElementById("emailText").textContent = currentUser.email;

if (currentUser.role === "instructor") {
  document.getElementById("roleText").textContent = "Instructor";
} else {
  document.getElementById("roleText").textContent = "Student";
}

const editProfileBtn = document.getElementById("editProfileBtn");
const profileMsg = document.getElementById("profileMsg");

const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");

function showProfileMsg(text, color) {
  profileMsg.textContent = text;
  profileMsg.style.color = color;
}

function openProfileModal() {
  editName.value = currentUser.name;
  editEmail.value = currentUser.email;
  profileModal.classList.remove("hidden");
}

function closeProfileModal() {
  profileModal.classList.add("hidden");
  profileForm.reset();
}

editProfileBtn.addEventListener("click", openProfileModal);
cancelProfileBtn.addEventListener("click", closeProfileModal);

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = editName.value.trim();
  const email = editEmail.value.trim();

  if (!name || !email) {
    showProfileMsg("Fill name and email.", "#DC2626");
    return;
  }

  
  currentUser.name = name;
  currentUser.email = email;

  // update display
  document.getElementById("nameText").textContent = currentUser.name;
  document.getElementById("emailText").textContent = currentUser.email;

  closeProfileModal();
  showProfileMsg("Profile updated (demo). Refresh resets.", "#059669");
});
// dashboard link depending on role
let dash = "student-dashboard.html";
if (currentUser.role === "instructor") dash = "instructor-dashboard.html";
document.getElementById("dashLink").href = dash;
document.getElementById("dashLink2").href = dash;
document.getElementById("dashLink3").href = dash;

// change password (demo)
const form = document.getElementById("passwordForm");
const currentPass = document.getElementById("currentPass");
const newPass = document.getElementById("newPass");
const confirmPass = document.getElementById("confirmPass");
const passMsg = document.getElementById("passMsg");

function showMsg(text, color) {
  passMsg.textContent = text;
  passMsg.style.color = color;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const oldP = currentPass.value;
  const p1 = newPass.value;
  const p2 = confirmPass.value;

  if (oldP !== currentUser.password) {
    showMsg("Current password is incorrect.", "#DC2626");
    return;
  }

  if (p1.length < 6) {
    showMsg("New password must be 6+ characters.", "#DC2626");
    return;
  }

  if (p1 !== p2) {
    showMsg("New passwords do not match.", "#DC2626");
    return;
  }

  // demo update (in memory only)
  currentUser.password = p1;

  currentPass.value = "";
  newPass.value = "";
  confirmPass.value = "";

  showMsg("Password updated (demo).", "#059669");
});