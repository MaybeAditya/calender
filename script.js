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
  databaseURL: "https://realtime-database-a8d07-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'calendar_data/'); 
const pingRef = ref(db, 'ping_data/'); 
const songRef = ref(db, 'daily_yt_song/');

let store = {};
let currentView = new Date();
let activeDate = null;
let initialPingLoad = true;
let currentVideoId = "";

// DOM Elements
const welcomeScreen = document.getElementById("welcomeScreen");
const enterBtn = document.getElementById("enterBtn");
const calendarGrid = document.getElementById("calendarGrid");
const monthDisplay = document.getElementById("monthDisplay");
const overlay = document.getElementById("overlay");
const noteField = document.getElementById("noteField");
const youBtn = document.getElementById("youBtn");
const gfBtn = document.getElementById("gfBtn");
const streakDisplay = document.getElementById("streakDisplay");
const pingBtn = document.getElementById("pingBtn");
const toast = document.getElementById("toast");
const songModal = document.getElementById("songModal");
const editSongIcon = document.getElementById("editSongIcon");
const ytUrlInput = document.getElementById("ytUrlInput");
const ytIframe = document.getElementById("ytIframe");

function iso(d) { return d.toISOString().slice(0, 10); }

// --- WELCOME SCREEN & AUTOPLAY HACK ---
enterBtn.onclick = () => {
  welcomeScreen.style.opacity = "0";
  setTimeout(() => welcomeScreen.style.display = "none", 800);
  
  if (currentVideoId) {
    ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
  }
};

// --- YOUTUBE SONG LOGIC ---
function extractYTId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

onValue(songRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.videoId) {
    currentVideoId = data.videoId;
    if (welcomeScreen.style.display === "none") {
      ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
    }
  }
});

editSongIcon.onclick = () => {
  songModal.style.display = "flex";
  ytUrlInput.value = ""; 
};

document.getElementById("saveSongBtn").onclick = () => {
  const videoId = extractYTId(ytUrlInput.value);
  if (videoId) {
    set(songRef, { videoId: videoId });
    songModal.style.display = "none";
  } else {
    alert("Oops! That doesn't look like a valid YouTube link.");
  }
};

document.getElementById("closeSongModalBtn").onclick = () => {
  songModal.style.display = "none";
};

// --- CALENDAR LOGIC ---
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

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  
  // Keep the edit icon intact when updating the month text
  const monthText = currentView.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  monthDisplay.innerHTML = `${monthText} <span id="editSongIcon" style="cursor: pointer; font-size: 0.8rem;" title="Change Song">✏️🎵</span>`;
  
  // Re-attach the click listener since we overwrote the innerHTML
  document.getElementById("editSongIcon").onclick = () => {
    songModal.style.display = "flex";
    ytUrlInput.value = "";
  };

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

// Real-time Cloud Sync for Calendar Data
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

// --- REAL-TIME PING LOGIC ---
pingBtn.onclick = () => {
  set(pingRef, { timestamp: Date.now() });
  pingBtn.textContent = "✨";
  setTimeout(() => pingBtn.textContent = "💭", 1000);
};

onValue(pingRef, (snapshot) => {
  if (initialPingLoad) {
    initialPingLoad = false;
    return;
  }
  const data = snapshot.val();
  if (data && (Date.now() - data.timestamp < 10000)) {
    triggerEruption();
  }
});

function triggerEruption() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);

  for (let i = 0; i < 40; i++) {
    const heart = document.createElement("div");
    heart.className = "fastHeart";
    heart.textContent = Math.random() > 0.5 ? "💖" : "✨";
    heart.style.left = "50%";
    heart.style.bottom = "20px";
    
    const tx = (Math.random() - 0.5) * 500 + "px"; 
    const ty = (Math.random() * -800) - 200 + "px"; 
    
    heart.style.setProperty('--tx', tx);
    heart.style.setProperty('--ty', ty);
    
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
  }
}

// --- MODAL & NAVIGATION LOGIC ---
function openModal(key) {
  activeDate = key;
  overlay.style.display = "flex";
  
  youBtn.classList.toggle("active", store[key]?.you || false);
  gfBtn.classList.toggle("active", store[key]?.gf || false);
  noteField.value = store[key]?.note || "";
}

document.getElementById("saveModalBtn").onclick = () => {
  const data = {
    you: youBtn.classList.contains("active"),
    gf: gfBtn.classList.contains("active"),
    note: noteField.value
  };

  set(ref(db, 'calendar_data/' + activeDate), data);
  overlay.style.display = "none";
};

document.getElementById("closeBtn").onclick = () => {
  overlay.style.display = "none";
};

document.getElementById("prevBtn").onclick = () => {
  currentView.setMonth(currentView.getMonth() - 1);
  renderCalendar();
};

document.getElementById("nextBtn").onclick = () => {
  currentView.setMonth(currentView.getMonth() + 1);
  renderCalendar();
};

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

// Start the App
createHearts();
renderCalendar();