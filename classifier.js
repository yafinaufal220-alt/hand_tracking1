/**
 * classifier.js
 * ─────────────────────────────────────────────────────────────
 * Klasifikasi huruf SIBI (Sistem Isyarat Bahasa Indonesia) A–Z
 * berdasarkan 21 titik landmark MediaPipe Hands.
 *
 * Landmark index:
 *  0 = Wrist
 *  1-4  = Ibu jari (thumb)
 *  5-8  = Telunjuk (index)
 *  9-12 = Tengah (middle)
 *  13-16= Manis (ring)
 *  17-20= Kelingking (pinky)
 *
 * Setiap jari: MCP(0), PIP(1), DIP(2), TIP(3) → index offset dari MCP
 * Contoh telunjuk: MCP=5, PIP=6, DIP=7, TIP=8
 */

const SIBI_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Cek apakah jari dalam posisi terentang (extended).
 * Tip harus lebih tinggi (y lebih kecil) dari PIP.
 * @param {Array} lm - array landmark [{x,y,z}]
 * @param {number} tip  - index landmark ujung jari
 * @param {number} pip  - index landmark sendi tengah jari
 * @returns {boolean}
 */
function isExtended(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

/**
 * Hitung jarak Euclidean 2D antara dua landmark.
 */
function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Cek apakah ujung jari "melipat" mendekati telapak.
 */
function isCurled(lm, tipIdx, wrist) {
  return dist2D(lm[tipIdx], wrist) < 0.28;
}

/**
 * Klasifikasi utama: menerima 21 landmark dan mengembalikan
 * [huruf, confidence] — contoh: ['A', 0.82]
 *
 * @param {Array} lm - Array 21 landmark dari MediaPipe
 * @returns {[string, number]}
 */
function classifySign(lm) {
  if (!lm || lm.length < 21) return ['?', 0];

  const wrist     = lm[0];
  const thumbTip  = lm[4];
  const thumbMid  = lm[3];
  const thumbMcp  = lm[2];

  // Status ekstensi tiap jari (true = terentang)
  const index  = isExtended(lm, 8,  6);
  const middle = isExtended(lm, 12, 10);
  const ring   = isExtended(lm, 16, 14);
  const pinky  = isExtended(lm, 20, 18);

  // Ibu jari: tip lebih ke samping dari knuckle (tangan kanan mirrored)
  const thumbOut = lm[4].x < lm[3].x;

  // Jumlah jari terentang (bukan ibu jari)
  const extCount = [index, middle, ring, pinky].filter(Boolean).length;
  const allExt   = extCount === 4;
  const noneExt  = extCount === 0;

  // Jarak antar ujung jari tertentu
  const d_thumb_index  = dist2D(thumbTip, lm[8]);
  const d_thumb_middle = dist2D(thumbTip, lm[12]);
  const d_index_middle = dist2D(lm[8], lm[12]);
  const d_thumb_ring   = dist2D(thumbTip, lm[16]);
  const d_index_pinky  = dist2D(lm[8], lm[20]);

  // Arah vertikal ujung telunjuk
  const indexPointDown = lm[8].y > wrist.y + 0.05;
  const indexPointSide = Math.abs(lm[8].x - wrist.x) > Math.abs(lm[8].y - wrist.y);

  // ── Pencocokan huruf ─────────────────────────────────────
  // A: Semua jari mengepal, ibu jari ke samping
  if (noneExt && !thumbOut && dist2D(thumbTip, lm[6]) > 0.08)
    return ['A', 0.80];

  // B: Semua 4 jari terentang lurus, ibu jari terlipat
  if (allExt && !thumbOut)
    return ['B', 0.82];

  // C: Jari-jari membentuk huruf C (setengah melingkar)
  if (!allExt && !noneExt && d_thumb_index < 0.22 && !index && middle)
    return ['C', 0.70];

  // D: Telunjuk berdiri, jari lain mengepal membentuk lingkaran dengan ibu jari
  if (index && !middle && !ring && !pinky && d_thumb_middle < 0.12)
    return ['D', 0.72];

  // E: Semua jari mengepal rapat, ibu jari di bawah jari-jari
  if (noneExt && d_thumb_index < 0.14)
    return ['E', 0.68];

  // F: Ibu jari + telunjuk menyentuh, jari lain terentang
  if (!index && middle && ring && pinky && d_thumb_index < 0.10)
    return ['F', 0.72];

  // G: Telunjuk + ibu jari menunjuk ke samping (horizontal)
  if (index && !middle && !ring && !pinky && thumbOut && indexPointSide)
    return ['G', 0.68];

  // H: Telunjuk + tengah terentang horizontal sejajar
  if (index && middle && !ring && !pinky && d_index_middle < 0.06)
    return ['H', 0.70];

  // I: Hanya kelingking terentang
  if (!index && !middle && !ring && pinky && !thumbOut)
    return ['I', 0.78];

  // J: Seperti I tapi dengan gerakan (statis: sama seperti I dengan ibu jari keluar)
  if (!index && !middle && !ring && pinky && thumbOut)
    return ['J', 0.62];

  // K: Telunjuk + tengah terentang, ibu jari di tengah, spread
  if (index && middle && !ring && !pinky && thumbOut && d_index_middle > 0.10)
    return ['K', 0.68];

  // L: Telunjuk berdiri + ibu jari keluar membentuk L
  if (index && !middle && !ring && !pinky && thumbOut)
    return ['L', 0.75];

  // M: Tiga jari (telunjuk, tengah, manis) mengepal di atas ibu jari
  if (noneExt && dist2D(thumbTip, lm[6]) < 0.10)
    return ['M', 0.62];

  // N: Dua jari (telunjuk, tengah) mengepal di atas ibu jari
  if (noneExt && dist2D(thumbTip, lm[10]) < 0.10 && dist2D(thumbTip, lm[6]) > 0.10)
    return ['N', 0.62];

  // O: Ujung-ujung jari menyentuh ibu jari membentuk O
  if (d_thumb_index < 0.07 && !index && !allExt)
    return ['O', 0.74];

  // P: Seperti K tapi mengarah ke bawah
  if (index && middle && !ring && !pinky && thumbOut && indexPointDown)
    return ['P', 0.64];

  // Q: Telunjuk + ibu jari menunjuk ke bawah
  if (index && !middle && !ring && !pinky && !thumbOut && indexPointDown)
    return ['Q', 0.62];

  // R: Telunjuk + tengah menyilang / berdampingan
  if (index && middle && !ring && !pinky && !thumbOut && d_index_middle < 0.08)
    return ['R', 0.68];

  // S: Kepalan tangan dengan ibu jari di atas jari-jari
  if (noneExt && thumbOut && d_thumb_index < 0.18 && d_thumb_index > 0.08)
    return ['S', 0.72];

  // T: Ibu jari disisipkan antara telunjuk dan tengah (kepalan)
  if (noneExt && dist2D(thumbTip, lm[6]) < 0.08)
    return ['T', 0.66];

  // U: Telunjuk + tengah terentang rapat berdampingan
  if (index && middle && !ring && !pinky && !thumbOut && d_index_middle < 0.05)
    return ['U', 0.72];

  // V: Telunjuk + tengah terentang membentuk V (lebih lebar)
  if (index && middle && !ring && !pinky && !thumbOut && d_index_middle > 0.10)
    return ['V', 0.78];

  // W: Tiga jari terentang (telunjuk, tengah, manis)
  if (index && middle && ring && !pinky && !thumbOut)
    return ['W', 0.72];

  // X: Telunjuk agak menekuk (hook)
  if (!index && !middle && !ring && !pinky && !thumbOut && isCurled(lm, 8, wrist))
    return ['X', 0.62];

  // Y: Ibu jari + kelingking terentang (shaka)
  if (!index && !middle && !ring && pinky && thumbOut)
    return ['Y', 0.78];

  // Z: Seperti telunjuk menggambar Z (statis: telunjuk menunjuk serong)
  if (index && !middle && !ring && !pinky && !thumbOut && !indexPointSide && !indexPointDown)
    return ['Z', 0.60];

  return ['?', 0.20];
}

/**
 * Normalisasi landmark agar posisi tangan tidak mempengaruhi hasil.
 * Menggeser ke wrist sebagai origin, scaling berdasarkan panjang telapak.
 * @param {Array} lm
 * @returns {Array} landmark ternormalisasi
 */
function normalizeLandmarks(lm) {
  const wrist = lm[0];
  const palmLen = dist2D(lm[0], lm[9]) || 1;

  return lm.map(pt => ({
    x: (pt.x - wrist.x) / palmLen,
    y: (pt.y - wrist.y) / palmLen,
    z: (pt.z - wrist.z) / palmLen,
  }));
}
