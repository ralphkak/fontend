const navBtns = document.querySelectorAll(".nav-btn");
const panels = document.querySelectorAll(".panel");

function setActive(id) {
  panels.forEach(p => p.classList.add("hidden"));
  document.querySelector(`#panel-${id}`).classList.remove("hidden");
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.app === id));
}

navBtns.forEach(btn => btn.addEventListener("click", () => setActive(btn.dataset.app)));
setActive("lifelogger"); // default

// Life Logger logic stays the same below
const logForm = document.getElementById("log-form");
const logList = document.getElementById("log-list");

async function refreshLogs() {
  const r = await fetch("/api/lifelogger/list");
  const data = await r.json();
  logList.innerHTML = "";
  for (const it of data.items) {
    const li = document.createElement("li");
    li.textContent = `${new Date(it.ts).toLocaleString()} — ${it.text}`;
    logList.appendChild(li);
  }
}

logForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(logForm);
  const payload = { text: form.get("text"), kind: "note", props: {} };
  await fetch("/api/lifelogger/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  logForm.reset();
  refreshLogs();
});

refreshLogs();
