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
const pingRef = ref(db, 'ping_data/'); 
const songRef = ref(db, 'daily_yt_song/');
const photoRef = ref(db, 'photos/');
const jarRef = ref(db, 'jar_notes/');

let store = {};
let currentView = new Date();
let activeDate = null;
let initialPingLoad = true;
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

// --- WELCOME & AUTOPLAY ---
enterBtn.onclick = () => {
  welcomeScreen.style.opacity = "0";
  setTimeout(() => welcomeScreen.style.display = "none", 800);
  if (currentVideoId) {
    ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
  }
};

// --- YOUTUBE SONG ---
onValue(songRef, (snapshot) => {
  const data = snapshot.val();
  if (data && data.videoId) {
    currentVideoId = data.videoId;
    if (welcomeScreen.style.display === "none") ytIframe.src = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1&playlist=${currentVideoId}&controls=1`;
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

document.getElementById("savePhotoBtn").onclick = () => {
  const file = document.getElementById("photoInput").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Compress image so database doesn't crash
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64Img = canvas.toDataURL('image/jpeg', 0.6);

      // Save to Firebase
      push(photoRef, { img: base64Img, addedBy: currentUser, time: Date.now() });
      document.getElementById("photoModal").style.display = "none";
      alert("Photo added successfully!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Display random photo on load
onValue(photoRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const photos = Object.values(data);
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
    document.getElementById("polaroidImg").src = randomPhoto.img;
    document.getElementById("polaroidImg").style.display = "block";
    document.getElementById("polaroidPlaceholder").style.display = "none";
  }
});

// --- REASONS I LOVE YOU JAR LOGIC ---
const jarModal = document.getElementById("jarModal");
const jarDisplay = document.getElementById("jarDisplay");
const jarAuthor = document.getElementById("jarAuthor");

onValue(jarRef, (snapshot) => {
  if (snapshot.val()) jarNotesArray = Object.values(snapshot.val());
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
  if (jarNotesArray.length === 0) {
    jarDisplay.textContent = "The jar is empty! Add a reason first.";
    return;
  }
  const randomNote = jarNotesArray[Math.floor(Math.random() * jarNotesArray.length)];
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

// --- PERSONALIZED PING LOGIC ---
document.getElementById("pingBtn").onclick = () => {
  set(pingRef, { timestamp: Date.now(), sender: currentUser });
  document.getElementById("pingBtn").textContent = "✨";
  setTimeout(() => document.getElementById("pingBtn").textContent = "💭", 1000);
};

onValue(pingRef, (snapshot) => {
  const data = snapshot.val();
  if (!data || data.sender === currentUser) return; // Don't ping yourself

  const lastSeenPing = localStorage.getItem('lastSeenPing') || 0;
  
  if (initialPingLoad) {
    if (data.timestamp > lastSeenPing) {
      document.getElementById("missedPingText").innerHTML = `💌 <b>${data.sender}</b> was thinking about you at ${formatTime(data.timestamp)}!`;
      document.getElementById("missedPingToast").classList.add("show");
    }
    initialPingLoad = false;
  } else {
    if (data.timestamp > lastSeenPing && (Date.now() - data.timestamp < 10000)) {
      document.getElementById("toast").textContent = `${data.sender} is thinking of you! 🥰`;
      triggerEruption();
      localStorage.setItem('lastSeenPing', data.timestamp);
    }
  }
});

document.getElementById("dismissPingBtn").onclick = () => {
  document.getElementById("missedPingToast").classList.remove("show");
  get(pingRef).then((snap) => { if (snap.val()) localStorage.setItem('lastSeenPing', snap.val().timestamp); });
};

function triggerEruption() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
  for (let i = 0; i < 40; i++) {
    const heart = document.createElement("div");
    heart.className = "fastHeart"; heart.textContent = Math.random() > 0.5 ? "💖" : "✨";
    heart.style.left = "50%"; heart.style.bottom = "20px";
    heart.style.setProperty('--tx', (Math.random() - 0.5) * 500 + "px"); 
    heart.style.setProperty('--ty', (Math.random() * -800) - 200 + "px"); 
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
  }
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