function showNotif(message, type = "success") {
  const existing = document.getElementById("notif");
  if (existing) existing.remove();

  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className = `notif notif-${type}`;
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function showConfirm(message, onYes, onNo = null) {
  const existing = document.getElementById("confirmNotif");
  if (existing) existing.remove();

  const notif = document.createElement("div");
  notif.id = "confirmNotif";
  notif.className = "confirm-notif";

  notif.innerHTML = `
    <div class="confirm-notif-content">
      <span>${message}</span>
      <div class="confirm-notif-actions">
        <button id="confirmYes" class="primary-btn small">Yes</button>
        <button id="confirmNo" class="secondary-btn small">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);

  document.getElementById("confirmYes").addEventListener("click", () => {
    notif.remove();
    if (onYes) onYes();
  });

  document.getElementById("confirmNo").addEventListener("click", () => {
    notif.remove();
    if (onNo) onNo();
  });
}