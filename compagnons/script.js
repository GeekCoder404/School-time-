const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const pipBtn = document.getElementById('pipBtn');
const video = document.getElementById('video');
const canvasSource = document.getElementById('source');

// ---------------- DATA ----------------
const pNames = ['P1', 'P2', 'P3', 'P4', 'PE'];
const sTimes = ['09h10', '10h35', '13h05', '14h30', '15h50'];
const eTimes = ['10h20', '11h45', '14h15', '15h40', '16h15'];

let usrclr = localStorage.getItem('clr') || '#fc03d3';
let clr = usrclr;
let pipActive = false;

const timeModSecs = 36;

// ---------------- TIME HELPERS ----------------
function parseTime(str) {
  const [h, m] = str.split('h').map(Number);
  return { h, m }
}

function toDateToday({ h, m }) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

Number.prototype.pad = function () {
  return String(this).padStart(2, '0');
};

// ---------------- CORE LOGIC ----------------
function getText() {
  const now = new Date();
  const nowAdj = new Date(now.getTime() + timeModSecs * 1000);

  const starts = sTimes.map(t => toDateToday(parseTime(t)));
  const ends = eTimes.map(t => toDateToday(parseTime(t)));

  let target = null;
  let index = 0;

  for (let i = 0; i < starts.length; i++) {
    if (nowAdj >= starts[i] && nowAdj < ends[i]) {
      target = ends[i];
      index = i;
      break;
    }
  }

  if (!target) {
    for (let i = 0; i < starts.length; i++) {
      if (nowAdj < starts[i]) {
        target = starts[i];
        index = i;
        break;
      }
    }
  }

  if (!target) {
    target = new Date(starts[0].getTime() + 86400000);
    index = 0;
  }

  const totalSec = Math.max(0, Math.floor((target - nowAdj) / 1000));

  const h = Math.floor(totalSec / 3600).pad();
  const m = Math.floor((totalSec % 3600) / 60).pad();
  const s = (totalSec % 60).pad();
  if (h == 0 && m < 5) clr = '#ffff00';
  if (h == 0 && m <= 1 && s <= 30) clr = '#ff0000';

  return `${pNames[index]} ${h}h ${m}m ${s}s`;
}

// ---------------- CANVAS ----------------
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function draw() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.clearRect(0, 0, w, h);

  if (canvasSource) ctx.drawImage(canvasSource, 0, 0, w, h);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const text = getText();
  document.title = text;

  ctx.fillStyle = clr;
  ctx.font = 'bolder 20vh Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, w / 2, h / 2);

  requestAnimationFrame(draw);
}

draw();

// ---------------- PIP ----------------
let streamReady = false;

pipBtn.addEventListener('click', async () => {
  try {
    if (!streamReady) {
      const stream = canvas.captureStream(30);
      video.srcObject = stream;

      video.muted = true;
      video.playsInline = true;

      await video.play();
      streamReady = true;
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      pipActive = false;
    } else {
      await video.requestPictureInPicture();
      pipActive = true;
    }
  } catch (err) {
    console.error('PiP error:', err);
  }
});

// ---------------- COLOR ----------------
window.addEventListener('DOMContentLoaded', () => {
  const clrInput = document.querySelector('#clr');
  clrInput.value = usrclr;

  document.querySelectorAll('.clring').forEach(el => {
    el.style.color = usrclr;
    el.style.border = `1px solid ${usrclr}`;
  });
});

document.querySelector('#clr').addEventListener('change', (e) => {
  usrclr = e.target.value;
  clr = usrclr;
  localStorage.setItem('clr', usrclr);

  document.querySelectorAll('.clring').forEach(el => {
    el.style.color = usrclr;
    el.style.border = `1px solid ${usrclr}`;
  });
});


async function ff() {
  try {
    const res = await fetch('https://tinyurllite.netlify.app');
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

ff();