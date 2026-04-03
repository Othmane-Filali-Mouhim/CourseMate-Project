document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

const response = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  const role = data.role;

  if (response.ok) {
    localStorage.setItem("token", data.token)
    localStorage.setItem("role", role)

    if(role === "student"){
      window.location.href = "student-dashboard.html"
    }else{
      window.location.href = "instructor-dashboard.html";
    }
    
  } else {
    const errorMsg = document.getElementById("error-message");
    errorMsg.textContent = data.message;
    errorMsg.style.display = "block";
  }
  
  
});