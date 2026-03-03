// --- REGISTER PWA SERVICE WORKER ---
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

// --- IDENTIFY USER ---
const urlParams = new URLSearchParams(window.location.search);
const currentUser = urlParams.get('u') === 'vibhuti' ? 'Vibhuti' : 'Aditya';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DB References
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

// --- UTILS ---
function iso(d) { return d.toISOString().slice(0, 10); }
function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// --- DOM ELEMENTS ---
const welcomeScreen = document.getElementById("welcomeScreen");
const enterBtn = document.getElementById("enterBtn");
const calendarGrid = document.getElementById("calendarGrid");
const ytIframe = document.getElementById("ytIframe");

// --- WELCOME, AUTOPLAY & NOTIFICATIONS ---
enterBtn.onclick = () => {
  welcomeScreen.style.opacity = "0";
  setTimeout(() => welcomeScreen.style.display = "none", 800);
  
  if (currentVideoId) {
    ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
  }

  // Request Native Notification Permission
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
};

// --- CACHED YOUTUBE LOGIC ---
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

// --- CALENDAR LOGIC ---
function renderCalendar() {
  calendarGrid.innerHTML = "";
  const y = currentView.getFullYear(); const m = currentView.getMonth();
  document.getElementById("monthDisplay").innerHTML = `${currentView.toLocaleDateString('default', { month: 'long', year: 'numeric' })} <span id="editSongIcon" style="cursor: pointer; font-size: 0.8rem;">✏️🎵</span>`;
  document.getElementById("editSongIcon").onclick = () => { document.getElementById("songModal").style.display = "flex"; };

  for (let i = 0; i < new Date(y, m, 1).getDay(); i++) calendarGrid.appendChild(document.createElement("div"));

  for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) {
    const key = iso(new Date(y, m, i));
    const cell = document.createElement("div");
    cell.className = "day"; cell.style.animationDelay = `${i * 0.02}s`;
    
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

onValue(dbRef, (snapshot) => { store = snapshot.val() || {}; renderCalendar(); });

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

// --- POLAROID LOGIC (Image Compression & Upload) ---
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
      alert("Photo added successfully!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

onValue(photoRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    document.getElementById("polaroidPlaceholder").style.display = "none";
    const photos = Object.values(data).sort((a, b) => b.time - a.time);
    const recentPhotos = photos.slice(0, 4);
    
    recentPhotos.forEach((photo, index) => {
      const imgTag = document.getElementById(`img${index + 1}`);
      if (imgTag) {
        imgTag.src = photo.img;
        imgTag.style.display = "block";
      }
    });

    if (!initialPhotoLoad && document.hidden && Notification.permission === "granted" && photos[0].addedBy !== currentUser) {
      new Notification(`📸 New memory added!`, { body: `${photos[0].addedBy} just uploaded a new photo.` });
    }
    initialPhotoLoad = false;
  }
});

// --- REASONS I LOVE YOU JAR LOGIC ---
const jarModal = document.getElementById("jarModal");
const jarDisplay = document.getElementById("jarDisplay");
const jarAuthor = document.getElementById("jarAuthor");
let initialJarLoad = true;

onValue(jarRef, (snapshot) => {
  if (snapshot.val()) {
    jarNotesArray = Object.values(snapshot.val());
    const latestNote = jarNotesArray[jarNotesArray.length - 1];
    
    if (!initialJarLoad && document.hidden && Notification.permission === "granted" && latestNote.addedBy !== currentUser) {
      new Notification(`🍯 A new reason was added!`, { body: `${latestNote.addedBy} added a new note to the jar.` });
    }
    initialJarLoad = false;
  }
});

document.getElementById("jarBtn").onclick = () => {
  jarModal.style.display = "flex";
  document.getElementById("jarReadActions").style.display = "flex";
  document.getElementById("jarWriteActions").style.display = "none";
  document.getElementById("newJarNote").style.display = "none";
  jarDisplay.style.display = "block";
  jarDisplay.textContent = "Click 'Draw a Note' to read one!";
  jarAuthor.textContent = "";
};

document.getElementById("drawNoteBtn").onclick = () => {
  const partnerNotes = jarNotesArray.filter(note => note.addedBy !== currentUser);

  if (partnerNotes.length === 0) {
    jarDisplay.textContent = "Your partner hasn't dropped any notes in the jar yet! Tell them to get writing! 🥺";
    jarAuthor.textContent = "";
    return;
  }

  const randomNote = partnerNotes[Math.floor(Math.random() * partnerNotes.length)];
  jarDisplay.textContent = `"${randomNote.text}"`;
  jarAuthor.textContent = `- Added by ${randomNote.addedBy}`;
};

document.getElementById("showAddNoteBtn").onclick = () => {
  jarDisplay.style.display = "none";
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


// --- UNLIMITED MISS YOU NOTIFICATION LOGIC ---
const missYouBtn = document.getElementById("missYouBtn");
let lastProcessedMissYou = localStorage.getItem('lastSeenMissYou') || 0;

missYouBtn.onclick = () => {
  set(missYouRef, { timestamp: Date.now(), sender: currentUser });
  missYouBtn.textContent = "✨";
  setTimeout(() => missYouBtn.textContent = "🥺", 1000);
};

onValue(missYouRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || data.sender === currentUser) return; 

  if (data.timestamp > lastProcessedMissYou) {
    lastProcessedMissYou = data.timestamp;
    localStorage.setItem('lastSeenMissYou', lastProcessedMissYou);

    if (initialMissYouLoad) {
      document.getElementById("missedToastText").innerHTML = `💌 <b>${data.sender}</b> was missing you at ${formatTime(data.timestamp)}!`;
      document.getElementById("missedToast").classList.add("show");
    } else {
      triggerRain(data.sender);
      
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`🥺 Miss You!`, {
          body: `${data.sender} was thinking about you at ${formatTime(data.timestamp)}. 💕`
        });
      }
    }
  }
  initialMissYouLoad = false;
});

function triggerRain(senderName) {
  const toast = document.getElementById("toast");
  toast.textContent = `${senderName} is missing you! 🥺`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);

  for (let i = 0; i < 35; i++) {
    const drop = document.createElement("div");
    drop.className = "rainDrop"; 
    drop.textContent = Math.random() > 0.5 ? "🥺" : "💙";
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = (Math.random() * 3 + 2) + "s";
    document.body.appendChild(drop);
    setTimeout(() => drop.remove(), 5000);
  }
}

document.getElementById("dismissToastBtn").onclick = () => {
  document.getElementById("missedToast").classList.remove("show");
};

// --- TIME TOGETHER CLOCK ---
// UPDATE THIS TO YOUR ACTUAL START DATE: YYYY-MM-DDTHH:MM:SS
const anniversaryDate = new Date("2024-11-30T00:00:00").getTime(); 
const timeTogetherDisplay = document.getElementById("timeTogether");

if (timeTogetherDisplay) {
  setInterval(() => {
    const now = new Date().getTime();
    const distance = now - anniversaryDate;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const format = (num) => num.toString().padStart(2, '0');

    timeTogetherDisplay.innerHTML = `⏱️ ${days}d : ${format(hours)}h : ${format(minutes)}m : ${format(seconds)}s`;
  }, 1000);
}

// Start App
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
WEEKDAYS.forEach(d => { const el = document.createElement("div"); el.textContent = d; document.getElementById("weekdayRow").appendChild(el); });
setInterval(() => {
  const h = document.createElement('div'); h.className = 'heart'; h.innerHTML = Math.random() > 0.5 ? '❤️' : '💖';
  h.style.left = Math.random() * 100 + 'vw'; h.style.animationDuration = (Math.random() * 5 + 5) + 's';
  document.getElementById('bubbleContainer').appendChild(h); setTimeout(() => h.remove(), 10000);
}, 800);

renderCalendar();
