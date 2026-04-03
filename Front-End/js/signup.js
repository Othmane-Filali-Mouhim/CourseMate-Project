document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.querySelector('input[name="role"]:checked').value;

  // Send data to backend
  const response = await fetch("http://localhost:8000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });

  // Read the response from backend
  const data = await response.json();

  if (response.ok) {
    alert("Account created successfully!");
    window.location.href = "login.html";
  } else {
    // Show error message on page
    const errorMsg = document.getElementById("error-message");
    errorMsg.textContent = data.message;
    errorMsg.style.display = "block";
  }
});