/**
 * app.js
 * ─────────────────────────────────────────────────────────────
 * Logika utama aplikasi SIBI Hand Tracker:
 * - Inisialisasi kamera & MediaPipe Hands
 * - Menampilkan skeleton tangan
 * - Klasifikasi huruf isyarat via classifier.js
 * - Update UI: kalimat, history, alphabet grid
 */

// ── DOM Elements ──────────────────────────────────────────────
const video       = document.getElementById('video');
const canvas      = document.getElementById('canvas');
const ringCanvas  = document.getElementById('ring-canvas');
const ctx         = canvas.getContext('2d');
const rCtx        = ringCanvas.getContext('2d');

const statusDot   = document.getElementById('status-dot');
const statusText  = document.getElementById('status-text');
const detLetter   = document.getElementById('detected-letter');
const signLabel   = document.getElementById('sign-label');
const confBar     = document.getElementById('conf-bar');
const holdBar     = document.getElementById('hold-bar');
const startOverlay= document.getElementById('start-overlay');
const startBtn    = document.getElementById('start-btn');
const fpsBadge    = document.getElementById('fps-badge');
const holdSpeedEl = document.getElementById('hold-speed');
const holdSpeedVal= document.getElementById('hold-speed-val');
const sentenceEl  = document.getElementById('sentence-display');
const historyList = document.getElementById('history-list');
const signGrid    = document.getElementById('sign-grid');

// ── State ─────────────────────────────────────────────────────
let sentence    = '';
let holdDuration = 1500;   // ms — waktu tahan isyarat sebelum ditambahkan
let holdStart   = 0;
let lastSign    = '';
let lastAddedTime = 0;
let cooldown    = 2200;    // ms jeda setelah huruf ditambahkan
let frameCount  = 0;
let lastFpsTime = performance.now();
let handsReady  = false;
let mp_hands    = null;
let cameraObj   = null;

// ── Build Alphabet Grid ───────────────────────────────────────
SIBI_ALPHABET.forEach(letter => {
  const cell = document.createElement('div');
  cell.className = 'sign-cell';
  cell.id = 'cell-' + letter;
  cell.textContent = letter;
  signGrid.appendChild(cell);
});

// ── Alphabet grid highlight ───────────────────────────────────
function highlightLetter(letter) {
  SIBI_ALPHABET.forEach(l => {
    const el = document.getElementById('cell-' + l);
    if (el) el.classList.remove('active');
  });
  if (letter && SIBI_ALPHABET.includes(letter)) {
    const el = document.getElementById('cell-' + letter);
    if (el) el.classList.add('active');
  }
}

// ── Sentence helpers ──────────────────────────────────────────
function updateSentence() {
  sentenceEl.innerHTML = sentence + '<span class="cursor"></span>';
}

function addSpace()    { sentence += ' '; updateSentence(); }
function deleteLast()  { sentence = sentence.slice(0, -1); updateSentence(); }
function clearAll()    {
  sentence = '';
  updateSentence();
  historyList.innerHTML = '';
  highlightLetter(null);
}

function speakSentence() {
  const text = sentence.trim();
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Expose to HTML buttons
window.addSpace    = addSpace;
window.deleteLast  = deleteLast;
window.clearAll    = clearAll;
window.speakSentence = speakSentence;

// ── History chips ─────────────────────────────────────────────
function addHistory(letter) {
  const chip = document.createElement('span');
  chip.className = 'hist-chip';
  chip.textContent = letter;
  historyList.appendChild(chip);
  // Batas 30 chip
  while (historyList.children.length > 30) {
    historyList.removeChild(historyList.firstChild);
  }
  historyList.scrollLeft = historyList.scrollWidth;
}

// ── Hold speed slider ─────────────────────────────────────────
holdSpeedEl.addEventListener('input', () => {
  holdDuration = parseInt(holdSpeedEl.value);
  holdSpeedVal.textContent = holdDuration + ' ms';
});

// ── Draw hand skeleton ────────────────────────────────────────
function drawHand(landmarks) {
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (typeof drawConnectors !== 'undefined') {
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: 'rgba(80, 160, 255, 0.6)',
      lineWidth: 2,
    });
    drawLandmarks(ctx, landmarks, {
      color: '#ffffff',
      fillColor: '#4a7cf7',
      lineWidth: 1,
      radius: 4,
    });
  } else {
    // Fallback manual jika library tidak load
    ctx.strokeStyle = 'rgba(80,160,255,0.7)';
    ctx.lineWidth = 2;
    landmarks.forEach(pt => {
      const x = pt.x * canvas.width;
      const y = pt.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4a7cf7';
      ctx.fill();
    });
  }
}

// ── Draw hold ring progress ───────────────────────────────────
function drawHoldRing(landmarks, progress) {
  ringCanvas.width  = video.videoWidth  || 640;
  ringCanvas.height = video.videoHeight || 480;
  rCtx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);

  if (progress <= 0) return;

  // Titik pusat = MCP telunjuk (landmark 9 = tengah telapak)
  const cx = landmarks[9].x * ringCanvas.width;
  const cy = landmarks[9].y * ringCanvas.height;
  const r  = 36;

  rCtx.beginPath();
  rCtx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  rCtx.strokeStyle = progress >= 1 ? '#4caf72' : '#4a7cf7';
  rCtx.lineWidth = 4;
  rCtx.lineCap = 'round';
  rCtx.stroke();

  if (progress >= 1) {
    rCtx.font = 'bold 18px Segoe UI, sans-serif';
    rCtx.fillStyle = '#4caf72';
    rCtx.textAlign = 'center';
    rCtx.textBaseline = 'middle';
    rCtx.fillText('✓', cx, cy);
  }
}

// ── FPS counter ───────────────────────────────────────────────
function updateFps() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastFpsTime;
  if (elapsed >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    fpsBadge.textContent = fps + ' FPS';
    frameCount = 0;
    lastFpsTime = now;
  }
}

// ── MediaPipe onResults ───────────────────────────────────────
function onResults(results) {
  updateFps();

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    // Tidak ada tangan terdeteksi
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rCtx.clearRect(0, 0, ringCanvas.width, ringCanvas.height);
    detLetter.textContent = '—';
    signLabel.textContent = 'Arahkan tangan ke kamera';
    confBar.style.width = '0%';
    holdBar.style.width = '0%';
    holdStart = 0;
    lastSign = '';
    highlightLetter(null);
    return;
  }

  const lm = results.multiHandLandmarks[0];
  drawHand(lm);

  // Normalisasi & klasifikasi
  const normLm = normalizeLandmarks(lm);
  const [sign, confidence] = classifySign(normLm);

  // Update UI
  if (sign !== '?') {
    detLetter.textContent = sign;
    signLabel.textContent = confidence > 0.7
      ? 'Terdeteksi dengan yakin'
      : confidence > 0.5
        ? 'Kemungkinan terdeteksi'
        : 'Kurang yakin...';
  } else {
    detLetter.textContent = '?';
    signLabel.textContent = 'Isyarat tidak dikenali';
  }

  // Confidence bar color
  const pct = Math.round(confidence * 100);
  confBar.style.width = pct + '%';
  confBar.style.background = confidence > 0.70 ? '#4caf72'
    : confidence > 0.50 ? '#f0b040'
    : '#f45f5f';

  highlightLetter(sign !== '?' ? sign : null);

  // ── Hold to add letter ──
  const now = Date.now();

  if (sign !== '?' && sign === lastSign) {
    if (holdStart === 0) holdStart = now;
    const held    = now - holdStart;
    const progress = Math.min(held / holdDuration, 1);
    holdBar.style.width = (progress * 100) + '%';
    drawHoldRing(lm, progress);

    // Tambahkan huruf setelah hold cukup & cooldown selesai
    if (held >= holdDuration && (now - lastAddedTime) > cooldown) {
      sentence += sign;
      updateSentence();
      addHistory(sign);
      lastAddedTime = now;
      holdStart     = now; // reset agar tidak terus menambah

      // Flash effect
      detLetter.style.color = '#4caf72';
      setTimeout(() => { detLetter.style.color = ''; }, 400);
    }
  } else {
    // Isyarat berubah — reset hold
    lastSign  = sign;
    holdStart = 0;
    holdBar.style.width = '0%';
    drawHoldRing(lm, 0);
  }
}

// ── Start Camera & MediaPipe ──────────────────────────────────
startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  startBtn.textContent = 'Memuat...';
  statusText.textContent = 'Meminta izin kamera...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width:  { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      statusText.textContent = 'Memuat model MediaPipe...';

      mp_hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      mp_hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence:  0.55,
      });

      mp_hands.onResults(onResults);

      cameraObj = new Camera(video, {
        onFrame: async () => {
          if (handsReady) await mp_hands.send({ image: video });
        },
        width:  1280,
        height: 720,
      });

      cameraObj.start().then(() => {
        handsReady = true;
        startOverlay.style.display = 'none';
        statusDot.classList.add('active');
        statusText.textContent = 'Kamera aktif — tunjukkan isyarat tangan';
      }).catch(err => {
        showError('Gagal memulai kamera: ' + err.message);
      });
    };

  } catch (err) {
    showError('Tidak dapat mengakses kamera: ' + err.message);
    startBtn.disabled = false;
    startBtn.textContent = '▶ Mulai Kamera';
  }
});

function showError(msg) {
  statusText.textContent = msg;
  statusDot.style.background = '#f45f5f';
  startBtn.disabled = false;
  startBtn.textContent = '↻ Coba Lagi';
}

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace') deleteLast();
  if (e.key === ' ')         { e.preventDefault(); addSpace(); }
  if (e.key === 'Enter')     speakSentence();
  if (e.key === 'Escape')    clearAll();
});
