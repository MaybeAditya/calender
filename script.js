import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyByChGfoCRrU65-a5i0NNBElPlyIT8j-BM",
  authDomain: "realtime-database-a8d07.firebaseapp.com",
  projectId: "realtime-database-a8d07",
  storageBucket: "realtime-database-a8d07.firebasestorage.app",
  messagingSenderId: "790416512120",
  appId: "1:790416512120:web:7c2ef26f2785d43cbe098d",
  measurementId: "G-VP5HLM4YMZ",
  databaseURL: "https://realtime-database-a8d07-default-rtdb.firebaseio.com" // Added this for Realtime Database
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'calendar_data/'); 

let store = {};
let currentView = new Date();
let activeDate = null;

// DOM Elements
const calendarGrid = document.getElementById("calendarGrid");
const monthDisplay = document.getElementById("monthDisplay");
const overlay = document.getElementById("overlay");
const noteField = document.getElementById("noteField");
const youBtn = document.getElementById("youBtn");
const gfBtn = document.getElementById("gfBtn");
const streakDisplay = document.getElementById("streakDisplay");

function iso(d) { return d.toISOString().slice(0, 10); }

// Floating Hearts Generator
function createHearts() {
  const container = document.getElementById('bubbleContainer');
  if (!container) return;
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

// Render Calendar Logic
function renderCalendar() {
  calendarGrid.innerHTML = "";
  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  
  if (monthDisplay) {
    monthDisplay.textContent = currentView.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
    if (store[key] && (store[key].you || store[key].gf)) {
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

// Calculate Streak
function updateStreak() {
  if (!streakDisplay) return;
  let streak = 0;
  let checkDate = new Date(); 
  
  while (true) {
    const key = iso(checkDate);
    if (store[key] && (store[key].you || store[key].gf)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1); 
    } else {
      break; 
    }
  }
  streakDisplay.textContent = `🔥 ${streak} Day Streak`;
}

// Real-time Cloud Sync (Listens for updates from her phone)
onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    store = data;
  } else {
    store = {};
  }
  renderCalendar();
  updateStreak();
});

function openModal(key) {
  activeDate = key;
  overlay.style.display = "flex";
  youBtn.classList.toggle("active", store[key]?.you || false);
  gfBtn.classList.toggle("active", store[key]?.gf || false);
  noteField.value = store[key]?.note || "";
}

// Save to Cloud (Sends updates to her phone)
document.getElementById("saveModalBtn").onclick = () => {
  const data = {
    you: youBtn.classList.contains("active"),
    gf: gfBtn.classList.contains("active"),
    note: noteField.value
  };

  set(ref(db, 'calendar_data/' + activeDate), data);
  overlay.style.display = "none";
};

// Navigation & Toggles
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

// Init Weekdays
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdayRow = document.getElementById("weekdayRow");
if (weekdayRow) {
  WEEKDAYS.forEach(d => {
    const el = document.createElement("div");
    el.textContent = d;
    weekdayRow.appendChild(el);
  });
}

createHearts();
renderCalendar();