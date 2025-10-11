// app/lifelogger_app/js/overlay-fix.js
(function () {
  // Try common selectors; adjust if yours differ
  const modal = document.querySelector("#connect-modal, .connect-modal, #gd-modal");
  if (!modal) return;

  const panel = modal.querySelector(".panel, .dialog, .card, .content") || modal;
  if (!panel.querySelector(".gdmodal-close")) {
    const btn = document.createElement("button");
    btn.className = "gdmodal-close";
    btn.setAttribute("aria-label", "Close");
    btn.title = "Close";
    btn.textContent = "×";
    btn.addEventListener("click", hideModal);
    panel.appendChild(btn);
  }

  // Expose show/hide globally so auth.js can call hideModal() after token
  function showModal() {
    modal.setAttribute("aria-hidden", "false");
    modal.classList.remove("is-hidden");
  }
  function hideModal() {
    modal.setAttribute("aria-hidden", "true");
    modal.classList.add("is-hidden");
  }

  // If your app already has show/hide, overwrite safely
  window.__gdModal = { showModal, hideModal };

  // Also close when clicking backdrop (optional)
  const backdrop = modal.querySelector(".backdrop");
  if (backdrop) backdrop.addEventListener("click", hideModal);
})();
