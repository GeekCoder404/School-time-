const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const pipBtn = document.getElementById('pipBtn');
const video = document.getElementById('video');

// ---------------- DATA ----------------
const pNames = ['P1', 'P2', 'PIC', 'P3', 'P4'];
const sTimes = ['08h10', '09h35', '10h55', '12h35', '14h00'];
const eTimes = ['09h20', '10h45', '11h15', '13h45', '15h10'];
let usrclr = localStorage.getItem('clr') || '#36d3ff';
let clr = '';

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

  const starts = sTimes.map((t) => toDateToday(parseTime(t)));
  const ends = eTimes.map((t) => toDateToday(parseTime(t)));

  let target = null;
  let index = 0;
  clr = usrclr;
  // during class
  for (let i = 0; i < starts.length; i++) {
    if (nowAdj >= starts[i] && nowAdj < ends[i]) {
      target = ends[i];
      index = i;
      break;
    }
  }

  // before class
  if (!target) {
    for (let i = 0; i < starts.length; i++) {
      if (nowAdj < starts[i]) {
        target = starts[i];
        index = i;
        break;
      }
    }
  }

  // after last class
  if (!target) {
    target = new Date(starts[0].getTime() + 86400000);
    index = 0;
  }

  const diff = target - nowAdj;
  const totalSec = Math.max(0, Math.floor(diff / 1000));

  const h = Math.floor(totalSec / 3600).pad();
  const m = Math.floor((totalSec % 3600) / 60).pad();
  const s = (totalSec % 60).pad();
  //if (h == 0 && m <= 5) clr = '#ffff00';
  //if (h == 0 && m <= 1 && s <= 30) clr = '#ff0000';
  return `${pNames[index]} ${h}h ${m}m ${s}s`;
}

// ---------------- CANVAS RENDER ----------------
function draw() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const text = getText();
  ctx.fillStyle = '#;fds
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = clr;
  ctx.font = 'bolder 20vh Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

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
    } else {
      await video.requestPictureInPicture();
    }
  } catch (err) {
    console.error('PiP error:', err);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const clr = document.querySelector('#clr');
  document.querySelectorAll('.clring').forEach((el) => {
    el.target.style.color = usrclr;
  });
  clr.value = usrclr;
});

document.querySelector('#clr').addEventListener('change', (e) => {
  usrclr = e.target.value;
  localStorage.setItem('clr', usrclr);
  document.querySelectorAll('.clring').forEach((el) => {
    el.target.style.color = usrclr;
  });
});