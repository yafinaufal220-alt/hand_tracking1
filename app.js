/**
 * app.js
 * ─────────────────────────────────────────────────────────────
 * Logika utama SIBI Kata:
 * - Kamera & MediaPipe Hands
 * - Deteksi gesture → cocokkan kata
 * - Update UI: kalimat, kamus, history, kategori
 */

// ── DOM ───────────────────────────────────────────────────────
const video        = document.getElementById('video');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const statusDot    = document.getElementById('status-dot');
const statusText   = document.getElementById('status-text');
const detEmoji     = document.getElementById('detected-emoji');
const detWord      = document.getElementById('detected-word');
const detDesc      = document.getElementById('detected-desc');
const confBar      = document.getElementById('conf-bar');
const holdBar      = document.getElementById('hold-bar');
const holdLabel    = document.getElementById('hold-label');
const startOverlay = document.getElementById('start-overlay');
const startBtn     = document.getElementById('start-btn');
const fpsBadge     = document.getElementById('fps-badge');
const catBadge     = document.getElementById('cat-badge');
const holdSpeedEl  = document.getElementById('hold-speed');
const holdValEl    = document.getElementById('hold-val');
const sentenceBox  = document.getElementById('sentence-box');
const historyEl    = document.getElementById('history');
const wordGridEl   = document.getElementById('word-grid');
const catFilterEl  = document.getElementById('cat-filter');

// ── State ─────────────────────────────────────────────────────
let sentence      = '';
let holdDuration  = 1500;
let holdStart     = 0;
let lastGesture   = '';
let lastWordId    = '';
let lastAddedTime = 0;
let cooldown      = 2500;
let activeCategory = 'Semua';
let frameCount    = 0;
let lastFpsTime   = performance.now();
let handsReady    = false;

// ── Build Category Filter ─────────────────────────────────────
ALL_CATEGORIES.forEach(cat => {
  const btn = document.createElement('button');
  btn.className = 'cat-btn' + (cat === 'Semua' ? ' active' : '');
  btn.textContent = cat;
  btn.addEventListener('click', () => {
    activeCategory = cat;
    catBadge.textContent = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildWordGrid();
  });
  catFilterEl.appendChild(btn);
});

// ── Build Word Grid (Kamus) ───────────────────────────────────
function buildWordGrid() {
  wordGridEl.innerHTML = '';
  const words = activeCategory === 'Semua'
    ? WORD_DICTIONARY
    : WORD_DICTIONARY.filter(w => w.kategori === activeCategory);

  words.forEach(w => {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.id = 'wc-' + w.id;
    card.innerHTML = `
      <div class="word-emoji">${w.emoji}</div>
      <div class="word-name">${w.kata}</div>
      <div class="word-hint">${w.hint}</div>
    `;
    wordGridEl.appendChild(card);
  });
}
buildWordGrid();

// ── Highlight active word card ────────────────────────────────
function highlightWordCard(wordId) {
  document.querySelectorAll('.word-card').forEach(c => c.classList.remove('active'));
  if (wordId) {
    const el = document.getElementById('wc-' + wordId);
    if (el) {
      el.classList.add('active');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ── Sentence ──────────────────────────────────────────────────
function updateSentence() {
  sentenceBox.innerHTML = sentence + '<span class="cursor"></span>';
}

function deleteLast() {
  // Hapus kata terakhir (bukan per huruf)
  const words = sentence.trim().split(' ');
  words.pop();
  sentence = words.join(' ');
  if (sentence) sentence += ' ';
  updateSentence();
}

function clearAll() {
  sentence = '';
  updateSentence();
  historyEl.innerHTML = '';
  highlightWordCard(null);
}

function speakSentence() {
  const text = sentence.trim();
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Expose ke HTML
window.deleteLast    = deleteLast;
window.clearAll      = clearAll;
window.speakSentence = speakSentence;

// ── History chip ──────────────────────────────────────────────
function addHistory(word) {
  const chip = document.createElement('span');
  chip.className = 'hist-chip';
  chip.textContent = word.emoji + ' ' + word.kata;
  historyEl.appendChild(chip);
  while (historyEl.children.length > 20) historyEl.removeChild(historyEl.firstChild);
}

// ── Speed slider ──────────────────────────────────────────────
holdSpeedEl.addEventListener('input', () => {
  holdDuration = parseInt(holdSpeedEl.value);
  holdValEl.textContent = holdDuration + ' ms';
});

// ── Draw hand ─────────────────────────────────────────────────
function drawHand(landmarks) {
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (typeof drawConnectors !== 'undefined') {
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: 'rgba(100, 180, 255, 0.65)',
      lineWidth: 2,
    });
    drawLandmarks(ctx, landmarks, {
      color: '#ffffff',
      fillColor: '#4a7cf7',
      lineWidth: 1,
      radius: 5,
    });
  }
}

// ── FPS ───────────────────────────────────────────────────────
function updateFps() {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsBadge.textContent = Math.round(frameCount * 1000 / (now - lastFpsTime)) + ' FPS';
    frameCount = 0;
    lastFpsTime = now;
  }
}

// ── MediaPipe onResults ───────────────────────────────────────
function onResults(results) {
  updateFps();

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detEmoji.textContent = '🤔';
    detWord.textContent  = '—';
    detDesc.textContent  = 'Arahkan tangan ke kamera';
    confBar.style.width  = '0%';
    holdBar.style.width  = '0%';
    holdStart   = 0;
    lastGesture = '';
    highlightWordCard(null);
    return;
  }

  const lm = results.multiHandLandmarks[0];
  drawHand(lm);

  // Deteksi gesture
  const { gesture, confidence } = detectGesture(lm);

  // Cocokkan dengan kata
  const { word, confidence: wordConf } = matchWord(gesture, activeCategory);
  const finalConf = Math.min(confidence * wordConf, 1);

  if (word) {
    detEmoji.textContent = word.emoji;
    detWord.textContent  = word.kata;
    detDesc.textContent  = word.hint;
    confBar.style.width  = Math.round(finalConf * 100) + '%';
    confBar.style.background = finalConf > 0.7 ? '#4caf72' : finalConf > 0.5 ? '#f0b040' : '#f45f5f';
    highlightWordCard(word.id);
  } else if (gesture !== 'unknown') {
    detEmoji.textContent = '🔍';
    detWord.textContent  = gesture.replace(/_/g, ' ');
    detDesc.textContent  = 'Gesture dikenali, kata belum terdaftar di kategori ini';
    confBar.style.width  = Math.round(confidence * 100) + '%';
    confBar.style.background = '#f0b040';
    highlightWordCard(null);
  } else {
    detEmoji.textContent = '❓';
    detWord.textContent  = '...';
    detDesc.textContent  = 'Isyarat tidak dikenali';
    confBar.style.width  = '0%';
    holdStart = 0;
    highlightWordCard(null);
    return;
  }

  // ── Hold logic: tambah kata ke kalimat ──
  const now = Date.now();
  const currentId = word ? word.id : gesture;

  if (currentId === lastWordId) {
    if (holdStart === 0) holdStart = now;
    const held     = now - holdStart;
    const progress = Math.min(held / holdDuration, 1);
    holdBar.style.width = Math.round(progress * 100) + '%';

    if (held >= holdDuration && (now - lastAddedTime) > cooldown) {
      if (word) {
        sentence += word.kata + ' ';
        updateSentence();
        addHistory(word);
        speakWord(word.kata);
      }
      lastAddedTime = now;
      holdStart     = now;

      // Flash hijau
      detWord.style.color = '#4caf72';
      setTimeout(() => { detWord.style.color = ''; }, 500);
    }
  } else {
    lastWordId  = currentId;
    holdStart   = 0;
    holdBar.style.width = '0%';
  }
}

// Ucapkan satu kata saat ditambahkan
function speakWord(kata) {
  const u = new SpeechSynthesisUtterance(kata);
  u.lang = 'id-ID';
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ── Start Camera ──────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  startBtn.disabled    = true;
  startBtn.textContent = 'Memuat...';
  statusText.textContent = 'Meminta izin kamera...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    });

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      statusText.textContent = 'Memuat model MediaPipe...';

      const mp_hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });

      mp_hands.setOptions({
        maxNumHands:            1,
        modelComplexity:        1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence:  0.55,
      });

      mp_hands.onResults(onResults);

      const cam = new Camera(video, {
        onFrame: async () => { if (handsReady) await mp_hands.send({ image: video }); },
        width: 1280, height: 720,
      });

      cam.start().then(() => {
        handsReady = true;
        startOverlay.style.display = 'none';
        statusDot.classList.add('active');
        statusText.textContent = 'Kamera aktif — tunjukkan isyarat tangan';
      }).catch(e => showError('Gagal memulai: ' + e.message));
    };

  } catch (e) {
    showError('Tidak dapat akses kamera: ' + e.message);
    startBtn.disabled    = false;
    startBtn.textContent = '▶ Mulai Kamera';
  }
});

function showError(msg) {
  statusText.textContent = msg;
  statusDot.style.background = '#f45f5f';
  startBtn.disabled    = false;
  startBtn.textContent = '↻ Coba Lagi';
}

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Backspace') { e.preventDefault(); deleteLast(); }
  if (e.key === 'Enter')     speakSentence();
  if (e.key === 'Escape')    clearAll();
});