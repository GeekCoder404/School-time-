const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const pipBtn = document.getElementById('pipBtn');
const video = document.getElementById('video');
const canvasSource = document.getElementById('source');

// ---------------- DATA ----------------
let usrclr = localStorage.getItem('clr') || def || '#36d3ff';
let bgClr = localStorage.getItem('bgClr') || '#000000';
let clr = usrclr;
let pipActive = false;

// ---------------- TIME HELPERS ----------------
function parseTime(str) {
  const [h, m] = str.split('h').map(Number);
  return { h, m };
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

  const savedClr = localStorage.getItem('clr') || def || usrclr;

  clr = savedClr;

  // ACTIVE COLORS (RESTORED)
  if (h == 0 && m <= 5) clr = '#ffff00';
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

// ---------------- COLOR HELPERS ----------------
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  const n = parseInt(hex.replace("#", ""), 16);
  if (isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function adjust(hex, p) {
  let [r, g, b] = hexToRgb(hex);
  r = clamp(r + p);
  g = clamp(g + p);
  b = clamp(b + p);
  return `rgb(${r},${g},${b})`;
}

// ---------------- TEXT ----------------
function drawGradientText(ctx, text, x, y, baseColor, w, h) {
  const safeColor = baseColor || def || usrclr;

  const dark = adjust(safeColor, -70);
  const light = adjust(safeColor, 70);

  const grad = ctx.createLinearGradient(0, h, w, 0);
  grad.addColorStop(0, dark);
  grad.addColorStop(0.5, safeColor);
  grad.addColorStop(1, light);

  let fontSize = h * 0.2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  while (fontSize > 10) {
    ctx.font = `bolder ${fontSize}px Outfit, Roboto`;
    if (ctx.measureText(text).width <= w) break;
    fontSize--;
  }

  ctx.fillStyle = grad;
  ctx.shadowColor = safeColor;
  ctx.shadowBlur = 12;

  ctx.fillText(text, x, y);
}

// ---------------- DRAW ----------------
function draw() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = bgClr || "#000";
  ctx.fillRect(0, 0, w, h);

  if (canvasSource) {
    ctx.drawImage(canvasSource, 0, 0, w, h);
  }

  const text = getText();
  document.title = text;

  drawGradientText(ctx, text, w / 2, h / 2, clr, w, h);

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

    const pipSupported =
      'pictureInPictureEnabled' in document &&
      document.pictureInPictureEnabled &&
      !video.disablePictureInPicture;

    if (pipSupported) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        pipActive = false;
      } else {
        await video.requestPictureInPicture();
        pipActive = true;
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    }

  } catch (err) {
    console.error('PiP error:', err);
  }
});

// ---------------- COLOR INPUTS (FIXED) ----------------
window.addEventListener('DOMContentLoaded', () => {
  usrclr = localStorage.getItem('clr') || def || '#36d3ff';
  bgClr = localStorage.getItem('bgClr') || '#000000';
  clr = usrclr;

  const clrInput = document.querySelector('#clr');
  const bgClrInput = document.querySelector('#bgClr');

  if (clrInput) clrInput.value = usrclr;
  if (bgClrInput) bgClrInput.value = bgClr;

  document.querySelectorAll('.clring').forEach(el => {
    el.style.color = usrclr;
    if (el.classList.contains('b')) {
      el.style.border = `1px solid ${usrclr}`;
    }
  });
});

document.querySelector('#clr')?.addEventListener('input', (e) => {
  usrclr = e.target.value;
  clr = usrclr;
  localStorage.setItem('clr', usrclr);

  document.querySelectorAll('.clring').forEach(el => {
    el.style.color = usrclr;
    if (el.classList.contains('b')) {
      el.style.border = `1px solid ${usrclr}`;
    }
  });
});

document.querySelector('#bgClr')?.addEventListener('input', (e) => {
  bgClr = e.target.value;
  localStorage.setItem('bgClr', bgClr);
});

// ---------------- FETCH ----------------
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