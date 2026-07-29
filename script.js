if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('Service Worker Error', err));
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const urlParams = new URLSearchParams(window.location.search);
const currentUser = urlParams.get('u') === 'vibhuti' ? 'Vibhuti' : 'Aditya';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const dbRef = ref(db, 'calendar_data/'); 
const missYouRef = ref(db, 'miss_you_data/');
const songRef = ref(db, 'daily_yt_song/');
const photoRef = ref(db, 'photos/');
const jarRef = ref(db, 'jar_notes/');

let store = {};
let currentView = new Date();
let activeDate = null;
let initialMissYouLoad = true;
let currentVideoId = "";
let jarNotesArray = [];

function iso(d) { return d.toISOString().slice(0, 10); }
function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

const welcomeScreen = document.getElementById("welcomeScreen");
const enterBtn = document.getElementById("enterBtn");
const calendarGrid = document.getElementById("calendarGrid");
const ytIframe = document.getElementById("ytIframe");

enterBtn.onclick = () => {
  welcomeScreen.style.opacity = "0";
  setTimeout(() => welcomeScreen.style.display = "none", 800);
  
  if (currentVideoId) {
    ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
  }

  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};

const cachedVideoId = localStorage.getItem('cachedYtSong');
if (cachedVideoId) {
  currentVideoId = cachedVideoId;
  if (welcomeScreen.style.display === "none") {
    ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
  }
}

onValue(songRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.videoId) {
    if (data.videoId !== currentVideoId) {
      currentVideoId = data.videoId;
      localStorage.setItem('cachedYtSong', currentVideoId); 
      if (welcomeScreen.style.display === "none") {
        ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
      }
    }
  }
});

document.getElementById("editSongIcon").onclick = () => { document.getElementById("songModal").style.display = "flex"; };
document.getElementById("closeSongModalBtn").onclick = () => { document.getElementById("songModal").style.display = "none"; };
document.getElementById("saveSongBtn").onclick = () => {
  const url = document.getElementById("ytUrlInput").value;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  if (match && match[2].length === 11) {
    set(songRef, { videoId: match[2] });
    document.getElementById("songModal").style.display = "none";
  } else alert("Invalid YouTube link.");
};

/* --- STREAK COUNTER LOGIC --- */
function updateStreakDisplay() {
  let streak = 0;
  let checkDate = new Date();
  let today = iso(checkDate);
  let yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  let yesterday = iso(yesterdayDate);

  if (!store[today] && !store[yesterday]) {
    document.getElementById("streakDisplay").innerHTML = `🍓 0 Day Streak`;
    return;
  }
  
  if (!store[today] && store[yesterday]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    let key = iso(checkDate);
    if (store[key] && (store[key].you || store[key].gf)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; 
    }
  }

  document.getElementById("streakDisplay").innerHTML = `🍓 ${streak} Day Streak${streak >= 3 ? ' 🔥' : ''}`;
}

/* --- CALENDAR WITH KOREAN DATES --- */
function renderCalendar() {
  calendarGrid.innerHTML = "";
  const y = currentView.getFullYear(); const m = currentView.getMonth();
  document.getElementById("monthDisplay").innerHTML = `${currentView.toLocaleDateString('default', { month: 'long', year: 'numeric' })} <span id="editSongIcon" style="cursor: pointer; font-size: 0.8rem;">🎧</span>`;
  document.getElementById("editSongIcon").onclick = () => { document.getElementById("songModal").style.display = "flex"; };

  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) calendarGrid.appendChild(document.createElement("div"));

  for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) {
    const key = iso(new Date(y, m, i));
    const cell = document.createElement("div");
    cell.className = "day"; cell.style.animationDelay = `${i * 0.02}s`;
    
    // Check for Korean Holidays
    let kHoliday = "";
    let mNum = m + 1;
    if (i === 14) {
       if (mNum === 2) kHoliday = "🍫"; // Valentine's Day
       else if (mNum === 3) kHoliday = "🍬"; // White Day
       else if (mNum === 5) kHoliday = "🌹"; // Rose Day
       else if (mNum === 9) kHoliday = "📸"; // Photo Day
       else kHoliday = "💕"; // Standard 14th marker
    }
    if (mNum === 11 && i === 11) kHoliday = "🥢"; // Pepero Day
    
    let marker = "";
    if (store[key] && (store[key].you || store[key].gf)) {
      cell.classList.add("hasData");
      if (store[key].you && store[key].gf) marker = "💕";
      else if (store[key].you) marker = "👦🏻";
      else if (store[key].gf) marker = "👧🏻";
    }
    
    cell.innerHTML = `<span>${i}</span><span class="holiday-marker">${kHoliday}</span><span class="marker">${marker}</span>`;
    cell.onclick = () => openModal(key);
    calendarGrid.appendChild(cell);
  }
}

onValue(dbRef, (snapshot) => { 
  store = snapshot.val() || {}; 
  renderCalendar(); 
  updateStreakDisplay();
});

function openModal(key) {
  activeDate = key;
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("youBtn").classList.toggle("active", store[key]?.you || false);
  document.getElementById("gfBtn").classList.toggle("active", store[key]?.gf || false);
  document.getElementById("noteField").value = store[key]?.note || "";
}

document.getElementById("saveModalBtn").onclick = () => {
  set(ref(db, 'calendar_data/' + activeDate), {
    you: document.getElementById("youBtn").classList.contains("active"),
    gf: document.getElementById("gfBtn").classList.contains("active"),
    note: document.getElementById("noteField").value
  });
  document.getElementById("overlay").style.display = "none";
};

document.getElementById("closeBtn").onclick = () => document.getElementById("overlay").style.display = "none";
document.getElementById("prevBtn").onclick = () => { currentView.setMonth(currentView.getMonth() - 1); renderCalendar(); };
document.getElementById("nextBtn").onclick = () => { currentView.setMonth(currentView.getMonth() + 1); renderCalendar(); };
document.getElementById("youBtn").onclick = (e) => e.target.classList.toggle("active");
document.getElementById("gfBtn").onclick = (e) => e.target.classList.toggle("active");

document.getElementById("addPhotoBtn").onclick = () => document.getElementById("photoModal").style.display = "flex";
document.getElementById("closePhotoModalBtn").onclick = () => document.getElementById("photoModal").style.display = "none";

let initialPhotoLoad = true;

document.getElementById("savePhotoBtn").onclick = () => {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64Img = canvas.toDataURL('image/jpeg', 0.6);

      push(photoRef, { img: base64Img, addedBy: currentUser, time: Date.now() });
      document.getElementById("photoModal").style.display = "none";
      alert("Photo saved successfully! 📸");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

onValue(photoRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    document.getElementById("polaroidPlaceholder").style.display = "none";
    const photos = Object.entries(data).map(([key, value]) => ({ id: key, ...value })).sort((a, b) => b.time - a.time);
    const recentPhotos = photos.slice(0, 4);
    
    recentPhotos.forEach((photo, index) => {
      const imgTag = document.getElementById(`img${index + 1}`);
      if (imgTag) {
        imgTag.src = photo.img;
        imgTag.style.display = "block";
        imgTag.oncontextmenu = (e) => {
          e.preventDefault();
          if (confirm("Delete this memory? ☁️")) set(ref(db, `photos/${photo.id}`), null);
        };
      }
    });

    if (!initialPhotoLoad && document.hidden && Notification.permission === "granted" && photos[0].addedBy !== currentUser) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '📸 New memory added!',
          body: `${photos[0].addedBy} just uploaded a new photo.`
        });
      }
    }
    initialPhotoLoad = false;
  }
});

/* --- NAMSAN LOVE LOCKS UI --- */
const jarModal = document.getElementById("jarModal");
const jarDisplay = document.getElementById("jarDisplay");
const jarAuthor = document.getElementById("jarAuthor");
let initialJarLoad = true;

onValue(jarRef, (snapshot) => {
  if (snapshot.val()) {
    jarNotesArray = Object.values(snapshot.val());
    const latestNote = jarNotesArray[jarNotesArray.length - 1];
    if (!initialJarLoad && document.hidden && Notification.permission === "granted" && latestNote.addedBy !== currentUser) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '🔒 A new lock was attached!',
          body: `${latestNote.addedBy} left a secret message on the fence.`
        });
      }
    }
    initialJarLoad = false;
  }
});

document.getElementById("jarBtn").onclick = () => {
  jarModal.style.display = "flex";
  document.getElementById("jarReadActions").style.display = "flex";
  document.getElementById("jarWriteActions").style.display = "none";
  document.getElementById("newJarNote").style.display = "none";
  jarAuthor.textContent = "";
  
  jarDisplay.innerHTML = "";
  jarDisplay.className = "lock-grid"; 
  
  if (jarNotesArray.length === 0) {
      jarDisplay.innerHTML = "<p style='text-align:center;'>The fence is empty! Attach the first lock. 🔒</p>";
  } else {
      jarNotesArray.forEach((note) => {
         const lockBtn = document.createElement("button");
         lockBtn.className = "lock-item";
         // Randomize colors for the locks slightly for a cute UI
         const colors = ["🔒", "🔓", "🔐"];
         lockBtn.innerHTML = colors[Math.floor(Math.random() * colors.length)];
         
         lockBtn.onclick = () => {
             jarDisplay.innerHTML = `<div class="lock-message">"${note.text}"</div>`;
             jarDisplay.className = ""; 
             jarAuthor.textContent = `- Locked by ${note.addedBy}`;
         };
         jarDisplay.appendChild(lockBtn);
      });
  }
};

document.getElementById("showAddNoteBtn").onclick = () => {
  jarDisplay.innerHTML = "";
  jarDisplay.className = "";
  jarAuthor.textContent = "";
  document.getElementById("newJarNote").style.display = "block";
  document.getElementById("jarReadActions").style.display = "none";
  document.getElementById("jarWriteActions").style.display = "flex";
};

document.getElementById("saveJarNoteBtn").onclick = () => {
  const text = document.getElementById("newJarNote").value;
  if (text.trim() !== "") {
    push(jarRef, { text: text, addedBy: currentUser, time: Date.now() });
    document.getElementById("newJarNote").value = "";
    jarModal.style.display = "none";
  }
};

document.getElementById("cancelJarWriteBtn").onclick = () => jarModal.style.display = "none";
document.getElementById("closeJarBtn").onclick = () => jarModal.style.display = "none";

const missYouBtn = document.getElementById("missYouBtn");
let lastProcessedMissYou = localStorage.getItem('lastSeenMissYou') || 0;

missYouBtn.onclick = () => {
  set(missYouRef, { timestamp: Date.now(), sender: currentUser });
  missYouBtn.textContent = "🎀";
  setTimeout(() => missYouBtn.textContent = "💌", 1000);
};

onValue(missYouRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || data.sender === currentUser) return; 

  if (data.timestamp > lastProcessedMissYou) {
    lastProcessedMissYou = data.timestamp;
    localStorage.setItem('lastSeenMissYou', lastProcessedMissYou);

    if (initialMissYouLoad) {
      document.getElementById("missedToastText").innerHTML = `💌 <b>${data.sender}</b> was missing you at ${formatTime(data.timestamp)}! 💕`;
      document.getElementById("missedToast").classList.add("show");
    } else {
      if (!document.hidden) {
        triggerMeteorShower(data.sender);
      } else if (document.hidden && Notification.permission === "granted" && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '💌 Thinking of you...',
          body: `${data.sender} is missing you right now. 🎀`
        });
      }
    }
  }
  initialMissYouLoad = false;
});

function triggerMeteorShower(senderName) {
  const toast = document.getElementById("toast");
  toast.textContent = `${senderName} is sending you love! 🎀`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
  
  for (let i = 0; i < 30; i++) {
    const drop = document.createElement("div");
    drop.className = "rainDrop"; 
    const shapes = ["🌸", "🎀", "🧸", "💕", "🍓"];
    drop.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    
    drop.style.left = Math.random() * 120 + "vw";
    drop.style.animationDuration = (Math.random() * 2 + 1) + "s";
    
    document.body.appendChild(drop);
    setTimeout(() => drop.remove(), 4000);
  }
}

document.getElementById("dismissToastBtn").onclick = () => document.getElementById("missedToast").classList.remove("show");

/* --- 100-DAY BAEK-IL MILESTONE TIMER --- */
const anniversaryDate = new Date("2024-01-01T00:00:00").getTime(); 
const timeTogetherDisplay = document.getElementById("timeTogether");

if (timeTogetherDisplay) {
  setInterval(() => {
    const now = new Date().getTime();
    const distance = now - anniversaryDate;
    
    // Calculate total days
    const totalDays = Math.floor(distance / (1000 * 60 * 60 * 24));
    
    // Calculate next 100-day milestone
    const nextMilestone = Math.ceil((totalDays + 1) / 100) * 100;
    const daysUntil = nextMilestone - totalDays;

    timeTogetherDisplay.innerHTML = `💕 Day ${totalDays} | ⏳ ${daysUntil} days until our ${nextMilestone}-Day!`;
  }, 1000);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
WEEKDAYS.forEach(d => { const el = document.createElement("div"); el.textContent = d; document.getElementById("weekdayRow").appendChild(el); });

setInterval(() => {
  const h = document.createElement('div'); h.className = 'heart'; 
  h.innerHTML = Math.random() > 0.5 ? '🌸' : '☁️';
  h.style.left = Math.random() * 100 + 'vw'; 
  h.style.animationDuration = (Math.random() * 10 + 10) + 's';
  document.getElementById('bubbleContainer').appendChild(h); 
  setTimeout(() => h.remove(), 20000);
}, 600);
