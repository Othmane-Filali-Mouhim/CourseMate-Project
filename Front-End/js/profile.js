const token = localStorage.getItem("token");
const BASE_URL = "http://localhost:8000/api";

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

// DOM
const nameText = document.getElementById("nameText");
const emailText = document.getElementById("emailText");
const roleText = document.getElementById("roleText");
const profileMsg = document.getElementById("profileMsg");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editProfileBtn = document.getElementById("editProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const passMsg = document.getElementById("passMsg");
const passwordForm = document.getElementById("passwordForm");

let currentUser = null;

// ----- LOAD PROFILE -----
async function loadProfile() {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to load profile.");
      return;
    }

    currentUser = data;

    nameText.textContent = data.name;
    emailText.textContent = data.email;
    roleText.textContent = data.role === "instructor" ? "Instructor" : "Student";

    // Set dashboard links based on role
    const dash = data.role === "instructor"
      ? "instructor-dashboard.html"
      : "student-dashboard.html";

    document.getElementById("dashLink").href = dash;
    document.getElementById("dashLink2").href = dash;
    document.getElementById("dashLink3").href = dash;

  } catch (error) {
    console.log("Error loading profile:", error);
  }
}

// ----- EDIT PROFILE MODAL -----
editProfileBtn.addEventListener("click", () => {
  editName.value = currentUser.name;
  editEmail.value = currentUser.email;
  profileModal.classList.remove("hidden");
});

cancelProfileBtn.addEventListener("click", () => {
  profileModal.classList.add("hidden");
  profileForm.reset();
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = editName.value.trim();
  const email = editEmail.value.trim();

  if (!name || !email) {
    profileMsg.textContent = "Fill in name and email.";
    profileMsg.style.color = "#DC2626";
    return;
  }

  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, email })
  });

  const data = await res.json();

  if (!res.ok) {
    profileMsg.textContent = data.message || "Failed to update profile.";
    profileMsg.style.color = "#DC2626";
    return;
  }

  currentUser = data;
  nameText.textContent = data.name;
  emailText.textContent = data.email;

  profileModal.classList.add("hidden");
  profileForm.reset();
  profileMsg.textContent = "Profile updated successfully.";
  profileMsg.style.color = "#059669";
});

// ----- CHANGE PASSWORD -----
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPass").value;
  const newPassword = document.getElementById("newPass").value;
  const confirmPassword = document.getElementById("confirmPass").value;

  if (newPassword !== confirmPassword) {
    passMsg.textContent = "New passwords do not match.";
    passMsg.style.color = "#DC2626";
    return;
  }

  if (newPassword.length < 6) {
    passMsg.textContent = "New password must be 6+ characters.";
    passMsg.style.color = "#DC2626";
    return;
  }

  const res = await fetch(`${BASE_URL}/auth/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();

  if (!res.ok) {
    passMsg.textContent = data.message || "Failed to update password.";
    passMsg.style.color = "#DC2626";
    return;
  }

  passwordForm.reset();
  passMsg.textContent = "Password updated successfully.";
  passMsg.style.color = "#059669";
});

// ----- INIT -----
loadProfile();