// notif.js
function showNotif(message, type = "success") {
  const existing = document.getElementById("notif");
  if (existing) existing.remove();

  const notif = document.createElement("div");
  notif.id = "notif";
  notif.textContent = message;
  notif.className = `notif notif-${type}`;

  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}