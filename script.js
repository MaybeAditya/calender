const KEY = "cuteCoupleCalendar";
let store = JSON.parse(localStorage.getItem(KEY)) || {};

const calendarGrid = document.getElementById("calendarGrid");
const monthDisplay = document.getElementById("monthDisplay");
const overlay = document.getElementById("overlay");
const noteField = document.getElementById("noteField");
const youBtn = document.getElementById("youBtn");
const gfBtn = document.getElementById("gfBtn");

let activeDate = null;
let currentView = new Date();

function iso(d) { return d.toISOString().slice(0, 10); }

// Generate Floating Hearts
function createHearts() {
  const container = document.getElementById('bubbleContainer');
  setInterval(() => {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = Math.random() > 0.5 ? '❤️' : '💖';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 10000);
  }, 800);
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  
  monthDisplay.textContent = currentView.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Offset for first day of week
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const key = iso(d);
    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.animationDelay = `${i * 0.02}s`;
    
    let marker = "";
    if (store[key]) {
      cell.classList.add("hasData");
      if (store[key].you && store[key].gf) marker = "💞";
      else if (store[key].you) marker = "❤️";
      else if (store[key].gf) marker = "💖";
    }

    cell.innerHTML = `<span>${i}</span><span class="marker">${marker}</span>`;
    cell.onclick = () => openModal(key);
    calendarGrid.appendChild(cell);
  }
}

function openModal(key) {
  activeDate = key;
  overlay.style.display = "flex";
  youBtn.classList.toggle("active", store[key]?.you);
  gfBtn.classList.toggle("active", store[key]?.gf);
  noteField.value = store[key]?.note || "";
}

document.getElementById("saveModalBtn").onclick = () => {
  store[activeDate] = {
    you: youBtn.classList.contains("active"),
    gf: gfBtn.classList.contains("active"),
    note: noteField.value
  };
  localStorage.setItem(KEY, JSON.stringify(store));
  overlay.style.display = "none";
  renderCalendar();
};

document.getElementById("prevBtn").onclick = () => {
  currentView.setMonth(currentView.getMonth() - 1);
  renderCalendar();
};

document.getElementById("nextBtn").onclick = () => {
  currentView.setMonth(currentView.getMonth() + 1);
  renderCalendar();
};

document.getElementById("closeBtn").onclick = () => overlay.style.display = "none";
youBtn.onclick = () => youBtn.classList.toggle("active");
gfBtn.onclick = () => gfBtn.classList.toggle("active");

// Init
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayRow = document.getElementById("weekdayRow");
WEEKDAYS.forEach(d => {
  const el = document.createElement("div");
  el.textContent = d;
  weekdayRow.appendChild(el);
});

createHearts();
renderCalendar();