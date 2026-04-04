// ─── CourseMate Theme System ───────────────────────────
// Apply theme immediately to avoid flash on page load
(function () {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
})();

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    updateButtonText();

    btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        updateButtonText();
    });

    function updateButtonText() {
        const current = document.documentElement.getAttribute("data-theme");
        btn.textContent = current === "dark" ? "Light Mode" : "Dark Mode";
    }
});
