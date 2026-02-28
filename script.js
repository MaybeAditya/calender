const KEY = "cuteCoupleCalendar";
let store = JSON.parse(localStorage.getItem(KEY)) || {};

const calendarGrid = document.getElementById("calendarGrid");
const weekdayRow = document.getElementById("weekdayRow");

const overlay = document.getElementById("overlay");
const youBtn = document.getElementById("youBtn");
const gfBtn = document.getElementById("gfBtn");
const noteField = document.getElementById("noteField");

const saveBtn = document.getElementById("saveModalBtn");
const closeBtn = document.getElementById("closeBtn");

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
let activeDate = null;
let view = new Date();

function iso(d){ return d.toISOString().slice(0,10); }

function renderWeekdays(){
  weekdayRow.innerHTML="";
  WEEKDAYS.forEach(d=>{
    const el=document.createElement("div");
    el.textContent=d;
    weekdayRow.appendChild(el);
  });
}

function renderCalendar(){
  calendarGrid.innerHTML="";
  const y=view.getFullYear();
  const m=view.getMonth();
  const days=new Date(y,m+1,0).getDate();

  for(let i=1;i<=days;i++){
    const d=new Date(y,m,i);
    const key=iso(d);

    const cell=document.createElement("div");
    cell.className="day";
    cell.textContent=i;

    if(store[key]) cell.classList.add("hasData");

    cell.onclick=()=>openModal(key);
    calendarGrid.appendChild(cell);
  }
}

function openModal(key){
  activeDate=key;
  overlay.style.display="flex";
  youBtn.classList.toggle("active",store[key]?.you);
  gfBtn.classList.toggle("active",store[key]?.gf);
  noteField.value=store[key]?.note||"";
}

saveBtn.onclick=()=>{
  store[activeDate]={
    you:youBtn.classList.contains("active"),
    gf:gfBtn.classList.contains("active"),
    note:noteField.value
  };
  localStorage.setItem(KEY,JSON.stringify(store));
  overlay.style.display="none";
  renderCalendar();
};

closeBtn.onclick=()=>overlay.style.display="none";
youBtn.onclick=()=>youBtn.classList.toggle("active");
gfBtn.onclick=()=>gfBtn.classList.toggle("active");

renderWeekdays();
renderCalendar();