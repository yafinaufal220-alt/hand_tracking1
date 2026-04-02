/**
 * classifier.js
 * ─────────────────────────────────────────────────────────────
 * Mendeteksi POLA GERAKAN (gesture) dari 21 landmark MediaPipe.
 * Gesture kemudian dicocokkan dengan kamus kata di words.js.
 *
 * Daftar gesture yang didukung:
 *  fist        - kepalan penuh
 *  open        - semua jari terbuka
 *  point_up    - hanya telunjuk
 *  peace       - telunjuk + tengah (V)
 *  three       - telunjuk + tengah + manis
 *  four        - semua kecuali ibu jari
 *  ok          - ibu jari + telunjuk melingkar
 *  thumbs_up   - ibu jari ke atas
 *  thumbs_down - ibu jari ke bawah
 *  pinky_up    - hanya kelingking
 *  shaka       - ibu jari + kelingking
 *  gun         - telunjuk + ibu jari
 *  claw        - jari-jari melengkung
 *  flat        - telapak datar
 *  crossed     - telunjuk + tengah menyilang
 *  horns       - telunjuk + kelingking
 *  cup         - jari ditekuk membentuk mangkuk
 */

// ── Helpers ───────────────────────────────────────────────────

function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Apakah jari terentang? Ujung jari lebih tinggi dari sendi tengah.
 */
function isUp(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

/**
 * Apakah jari menekuk ke bawah? Ujung jari lebih rendah dari MCP.
 */
function isDown(lm, tip, mcp) {
  return lm[tip].y > lm[mcp].y + 0.02;
}

/**
 * Normalisasi landmark relatif terhadap pergelangan tangan.
 */
function normalizeLandmarks(lm) {
  const wrist  = lm[0];
  const scale  = dist2D(lm[0], lm[9]) || 1;
  return lm.map(pt => ({
    x: (pt.x - wrist.x) / scale,
    y: (pt.y - wrist.y) / scale,
    z: (pt.z - wrist.z) / scale,
  }));
}

// ── Gesture Classifier ────────────────────────────────────────

/**
 * Mendeteksi pola gerakan dari landmark.
 * @param {Array} raw - 21 landmark asli dari MediaPipe
 * @returns {{ gesture: string, confidence: number }}
 */
function detectGesture(raw) {
  if (!raw || raw.length < 21) return { gesture: 'unknown', confidence: 0 };

  const lm = normalizeLandmarks(raw);

  const wrist    = lm[0];
  const thumbTip = lm[4];
  const thumbIp  = lm[3];
  const thumbMcp = lm[2];

  // Status ekstensi jari (true = terentang ke atas)
  const index  = isUp(lm, 8,  6);
  const middle = isUp(lm, 12, 10);
  const ring   = isUp(lm, 16, 14);
  const pinky  = isUp(lm, 20, 18);

  // Ibu jari ke atas / bawah / samping
  const thumbUp   = lm[4].y < lm[3].y - 0.1;
  const thumbDown = lm[4].y > lm[3].y + 0.1;
  const thumbSide = lm[4].x < lm[3].x;  // mirrored

  const ext4 = [index, middle, ring, pinky];
  const extCount = ext4.filter(Boolean).length;

  // Jarak penting
  const d_ti   = dist2D(thumbTip, lm[8]);   // ibu jari ke telunjuk
  const d_tm   = dist2D(thumbTip, lm[12]);  // ibu jari ke tengah
  const d_im   = dist2D(lm[8], lm[12]);     // telunjuk ke tengah
  const d_ip   = dist2D(lm[8], lm[20]);     // telunjuk ke kelingking

  // Apakah semua 4 jari menekuk (melengkung)?
  const allCurl = ext4.every(e => !e);

  // ── Rule matching ─────────────────────────────────────────

  // FIST: semua jari mengepal, ibu jari di samping / depan
  if (allCurl && !thumbUp && !thumbDown) {
    return { gesture: 'fist', confidence: 0.88 };
  }

  // OPEN: semua jari terentang
  if (extCount === 4 && !thumbUp && !thumbDown) {
    return { gesture: 'open', confidence: 0.85 };
  }

  // THUMBS_UP: ibu jari ke atas, jari lain mengepal
  if (thumbUp && allCurl) {
    return { gesture: 'thumbs_up', confidence: 0.90 };
  }

  // THUMBS_DOWN: ibu jari ke bawah, jari lain mengepal
  if (thumbDown && allCurl) {
    return { gesture: 'thumbs_down', confidence: 0.88 };
  }

  // OK: ibu jari + telunjuk membentuk lingkaran, jari lain terentang
  if (d_ti < 0.12 && !index && middle && ring && pinky) {
    return { gesture: 'ok', confidence: 0.82 };
  }

  // POINT_UP: hanya telunjuk berdiri
  if (index && !middle && !ring && !pinky && !thumbUp) {
    return { gesture: 'point_up', confidence: 0.85 };
  }

  // PEACE / V: telunjuk + tengah, jari lain mengepal
  if (index && middle && !ring && !pinky && d_im > 0.10 && !thumbUp) {
    return { gesture: 'peace', confidence: 0.82 };
  }

  // CROSSED: telunjuk + tengah menyilang (rapat)
  if (index && middle && !ring && !pinky && d_im < 0.06) {
    return { gesture: 'crossed', confidence: 0.75 };
  }

  // THREE: telunjuk + tengah + manis
  if (index && middle && ring && !pinky && !thumbUp) {
    return { gesture: 'three', confidence: 0.80 };
  }

  // FOUR: empat jari kecuali ibu jari
  if (extCount === 4 && !thumbUp) {
    return { gesture: 'four', confidence: 0.78 };
  }

  // PINKY_UP: hanya kelingking berdiri
  if (!index && !middle && !ring && pinky && !thumbUp) {
    return { gesture: 'pinky_up', confidence: 0.85 };
  }

  // SHAKA: ibu jari + kelingking (love/shaka)
  if (!index && !middle && !ring && pinky && thumbSide) {
    return { gesture: 'shaka', confidence: 0.82 };
  }

  // HORNS: telunjuk + kelingking (tanduk)
  if (index && !middle && !ring && pinky && !thumbUp) {
    return { gesture: 'horns', confidence: 0.80 };
  }

  // GUN: telunjuk + ibu jari menunjuk (pistol)
  if (index && !middle && !ring && !pinky && thumbSide) {
    return { gesture: 'gun', confidence: 0.78 };
  }

  // CLAW: jari-jari setengah menekuk (tidak lurus, tidak mengepal)
  const halfCurl = ext4.filter(Boolean).length >= 2 &&
    [lm[8],lm[12],lm[16],lm[20]].some(pt => pt.y > wrist.y - 0.2 && pt.y < wrist.y + 0.3);
  if (halfCurl && !allCurl && extCount < 4) {
    return { gesture: 'claw', confidence: 0.65 };
  }

  // FLAT: telapak datar (semua jari sedikit ditekuk rata)
  const flatCheck = ext4.every(e => e) && Math.abs(lm[8].y - lm[20].y) < 0.15;
  if (flatCheck) {
    return { gesture: 'flat', confidence: 0.70 };
  }

  // CUP: jari-jari menekuk seperti mangkuk (setengah genggam)
  if (!allCurl && extCount <= 2 && d_ti > 0.15) {
    return { gesture: 'cup', confidence: 0.62 };
  }

  return { gesture: 'unknown', confidence: 0 };
}

/**
 * Cocokkan gesture dengan kamus kata.
 * @param {string} gesture
 * @param {string} activeCategory - kategori aktif ('Semua' atau nama kategori)
 * @returns {{ word: object|null, confidence: number }}
 */
function matchWord(gesture, activeCategory = 'Semua') {
  if (gesture === 'unknown') return { word: null, confidence: 0 };

  const candidates = WORD_DICTIONARY.filter(w => {
    const catMatch = activeCategory === 'Semua' || w.kategori === activeCategory;
    return w.gesture === gesture && catMatch;
  });

  if (candidates.length === 0) return { word: null, confidence: 0 };

  // Jika ada beberapa kandidat dengan gesture sama, kembalikan yang pertama
  // (bisa dikembangkan dengan konteks tambahan)
  return { word: candidates[0], confidence: 0.80 };
}
