const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });

const pipBtn = document.getElementById('pipBtn');
const video = document.getElementById('video');

// IMPORTANT: define your source (replace with your real one)
const source = document.getElementById('source'); // or video, image, etc.

// ---------------- DATA ----------------
const pNames = ['P1', 'P2', 'PIC', 'P3', 'P4'];
const sTimes = ['08h10', '09h35', '10h55', '12h35', '14h00'];
const eTimes = ['09h20', '10h45', '11h15', '13h45', '15h10'];

let usrclr = localStorage.getItem('clr') || '#36d3ff';
let clr = usrclr;
let pipActive = false;

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
  const timeModSecs = 36;
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

  // clear safely
  ctx.clearRect(0, 0, w, h);

  // background/source
  if (source) ctx.drawImage(source, 0, 0, w, h);
  if(pipActive) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // text
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