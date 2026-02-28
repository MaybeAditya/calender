const KEY = 'cuteCoupleCalendarV2';
let store = JSON.parse(localStorage.getItem(KEY)) || { days: {} };

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const calendarGrid = document.getElementById('calendarGrid');
const weekdayRow = document.getElementById('weekdayRow');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');

const overlay = document.getElementById('overlay');
const youBtn = document.getElementById('youBtn');
const gfBtn = document.getElementById('gfBtn');
const noteField = document.getElementById('noteField');
const saveModalBtn = document.getElementById('saveModalBtn');
const closeBtn = document.getElementById('closeBtn');
const deleteBtn = document.getElementById('deleteBtn');

let viewDate = new Date();
let activeKey = null;

const toISO = d => d.toISOString().slice(0,10);
const pretty = k => new Date(k+'T00:00:00').toDateString();

function renderWeekdays(){
  weekdayRow.innerHTML='';
  WEEKDAYS.forEach(w=>{
    const d=document.createElement('div');
    d.className='weekday';
    d.textContent=w;
    weekdayRow.appendChild(d);
  });
}

function renderCalendar(){
  calendarGrid.innerHTML='';
  const y=viewDate.getFullYear(), m=viewDate.getMonth();
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();

  for(let i=0;i<first;i++){
    calendarGrid.appendChild(document.createElement('div'));
  }

  for(let d=1;d<=days;d++){
    const date=new Date(y,m,d);
    const key=toISO(date);
    const box=document.createElement('div');
    box.className='day';

    const num=document.createElement('div');
    num.textContent=d;
    box.appendChild(num);

    const emoji=document.createElement('div');
    emoji.className='emoji';

    const e=store.days[key];
    if(e){
      emoji.textContent=e.you&&e.gf?'💞':e.you?'❤️':'💖';
      box.classList.add('hasData');
    }
    box.appendChild(emoji);

    box.onclick=()=>openModal(key);
    calendarGrid.appendChild(box);
  }
}

function openModal(key){
  activeKey=key;
  const e=store.days[key]||{};
  youBtn.classList.toggle('active',e.you);
  gfBtn.classList.toggle('active',e.gf);
  noteField.value=e.note||'';
  overlay.style.display='flex';
}

saveModalBtn.onclick=()=>{
  if(!activeKey) return;
  store.days[activeKey]={
    you:youBtn.classList.contains('active'),
    gf:gfBtn.classList.contains('active'),
    note:noteField.value
  };
  localStorage.setItem(KEY,JSON.stringify(store));
  overlay.style.display='none';
  renderCalendar();
};

closeBtn.onclick=()=>overlay.style.display='none';

renderWeekdays();
renderCalendar();