/**
 * words.js
 * ─────────────────────────────────────────────────────────────
 * Kamus kata bahasa isyarat SIBI per kata.
 * Setiap kata memiliki:
 *  - id       : identifier unik
 *  - kata     : kata dalam Bahasa Indonesia
 *  - emoji    : representasi visual
 *  - kategori : kelompok kata
 *  - gesture  : nama pola gerakan tangan yang digunakan
 *  - hint     : deskripsi singkat cara isyarat
 *
 * Gesture yang tersedia (didefinisikan di classifier.js):
 *  "fist"          - kepalan tangan
 *  "open"          - tangan terbuka semua jari
 *  "point_up"      - telunjuk berdiri
 *  "peace"         - telunjuk + tengah (V)
 *  "three"         - telunjuk + tengah + manis
 *  "four"          - semua jari kecuali ibu jari
 *  "ok"            - ibu jari + telunjuk membentuk O
 *  "thumbs_up"     - ibu jari ke atas
 *  "thumbs_down"   - ibu jari ke bawah
 *  "pinky_up"      - hanya kelingking
 *  "shaka"         - ibu jari + kelingking (shaka)
 *  "gun"           - telunjuk + ibu jari (pistol)
 *  "claw"          - jari-jari melengkung seperti cakar
 *  "flat"          - telapak tangan datar menghadap depan
 *  "crossed"       - telunjuk + tengah menyilang
 *  "horns"         - telunjuk + kelingking (tanduk)
 *  "cup"           - jari-jari menekuk membentuk mangkuk
 */

const WORD_DICTIONARY = [

  // ── Kegiatan Sehari-hari ─────────────────────────────────
  {
    id: 'makan',
    kata: 'Makan',
    emoji: '🍽️',
    kategori: 'Kegiatan',
    gesture: 'cup',
    hint: 'Jari menekuk seperti memegang sendok ke mulut',
  },
  {
    id: 'minum',
    kata: 'Minum',
    emoji: '🥤',
    kategori: 'Kegiatan',
    gesture: 'ok',
    hint: 'Ibu jari + telunjuk membentuk O, seperti memegang gelas',
  },
  {
    id: 'tidur',
    kata: 'Tidur',
    emoji: '😴',
    kategori: 'Kegiatan',
    gesture: 'flat',
    hint: 'Telapak tangan datar menghadap depan (istirahat)',
  },
  {
    id: 'bangun',
    kata: 'Bangun',
    emoji: '🌅',
    kategori: 'Kegiatan',
    gesture: 'open',
    hint: 'Tangan terbuka semua jari ke atas',
  },
  {
    id: 'jalan',
    kata: 'Jalan',
    emoji: '🚶',
    kategori: 'Kegiatan',
    gesture: 'peace',
    hint: 'Telunjuk + tengah (V) menghadap bawah, seperti kaki berjalan',
  },
  {
    id: 'duduk',
    kata: 'Duduk',
    emoji: '🪑',
    kategori: 'Kegiatan',
    gesture: 'crossed',
    hint: 'Telunjuk + tengah menyilang, ditekuk ke bawah',
  },
  {
    id: 'berdiri',
    kata: 'Berdiri',
    emoji: '🧍',
    kategori: 'Kegiatan',
    gesture: 'point_up',
    hint: 'Hanya telunjuk berdiri tegak lurus',
  },
  {
    id: 'mandi',
    kata: 'Mandi',
    emoji: '🚿',
    kategori: 'Kegiatan',
    gesture: 'claw',
    hint: 'Jari-jari melengkung seperti menggosok badan',
  },
  {
    id: 'berlari',
    kata: 'Berlari',
    emoji: '🏃',
    kategori: 'Kegiatan',
    gesture: 'horns',
    hint: 'Telunjuk + kelingking (tanduk), goyang ke depan',
  },
  {
    id: 'masak',
    kata: 'Masak',
    emoji: '🍳',
    kategori: 'Kegiatan',
    gesture: 'three',
    hint: 'Tiga jari terentang, telapak menghadap atas (wajan)',
  },

  // ── Perasaan ─────────────────────────────────────────────
  {
    id: 'senang',
    kata: 'Senang',
    emoji: '😊',
    kategori: 'Perasaan',
    gesture: 'thumbs_up',
    hint: 'Ibu jari ke atas — tanda baik/senang',
  },
  {
    id: 'sedih',
    kata: 'Sedih',
    emoji: '😢',
    kategori: 'Perasaan',
    gesture: 'thumbs_down',
    hint: 'Ibu jari ke bawah — tanda tidak baik/sedih',
  },
  {
    id: 'marah',
    kata: 'Marah',
    emoji: '😠',
    kategori: 'Perasaan',
    gesture: 'fist',
    hint: 'Kepalan tangan penuh — ekspresi kuat/marah',
  },
  {
    id: 'takut',
    kata: 'Takut',
    emoji: '😨',
    kategori: 'Perasaan',
    gesture: 'claw',
    hint: 'Jari-jari melengkung gemetar seperti ketakutan',
  },
  {
    id: 'suka',
    kata: 'Suka',
    emoji: '❤️',
    kategori: 'Perasaan',
    gesture: 'shaka',
    hint: 'Ibu jari + kelingking (love/shaka)',
  },
  {
    id: 'benci',
    kata: 'Benci',
    emoji: '💢',
    kategori: 'Perasaan',
    gesture: 'horns',
    hint: 'Telunjuk + kelingking (tanduk) — ekspresi negatif',
  },
  {
    id: 'lelah',
    kata: 'Lelah',
    emoji: '😩',
    kategori: 'Perasaan',
    gesture: 'four',
    hint: 'Empat jari ditekuk lemah ke bawah',
  },
  {
    id: 'sakit',
    kata: 'Sakit',
    emoji: '🤒',
    kategori: 'Perasaan',
    gesture: 'gun',
    hint: 'Telunjuk + ibu jari menunjuk ke badan',
  },

  // ── Sapaan & Komunikasi ──────────────────────────────────
  {
    id: 'halo',
    kata: 'Halo',
    emoji: '👋',
    kategori: 'Sapaan',
    gesture: 'open',
    hint: 'Tangan terbuka semua jari, seperti melambaikan tangan',
  },
  {
    id: 'terima_kasih',
    kata: 'Terima Kasih',
    emoji: '🙏',
    kategori: 'Sapaan',
    gesture: 'flat',
    hint: 'Telapak datar di depan dada, anggukkan kepala',
  },
  {
    id: 'tolong',
    kata: 'Tolong',
    emoji: '🆘',
    kategori: 'Sapaan',
    gesture: 'thumbs_up',
    hint: 'Ibu jari ke atas dengan gerakan ke depan',
  },
  {
    id: 'maaf',
    kata: 'Maaf',
    emoji: '🤝',
    kategori: 'Sapaan',
    gesture: 'fist',
    hint: 'Kepalan tangan di dada, gerakan memutar',
  },
  {
    id: 'ya',
    kata: 'Ya',
    emoji: '✅',
    kategori: 'Sapaan',
    gesture: 'thumbs_up',
    hint: 'Ibu jari ke atas (setuju/ya)',
  },
  {
    id: 'tidak',
    kata: 'Tidak',
    emoji: '❌',
    kategori: 'Sapaan',
    gesture: 'thumbs_down',
    hint: 'Ibu jari ke bawah (tidak setuju/tidak)',
  },
  {
    id: 'selamat',
    kata: 'Selamat',
    emoji: '🎉',
    kategori: 'Sapaan',
    gesture: 'peace',
    hint: 'Dua jari V ke atas — tanda selamat/kemenangan',
  },

  // ── Kebutuhan ────────────────────────────────────────────
  {
    id: 'air',
    kata: 'Air',
    emoji: '💧',
    kategori: 'Kebutuhan',
    gesture: 'ok',
    hint: 'OK/lingkaran — seperti memegang botol air',
  },
  {
    id: 'toilet',
    kata: 'Toilet',
    emoji: '🚻',
    kategori: 'Kebutuhan',
    gesture: 'gun',
    hint: 'Telunjuk + ibu jari, tunjuk ke bawah',
  },
  {
    id: 'obat',
    kata: 'Obat',
    emoji: '💊',
    kategori: 'Kebutuhan',
    gesture: 'pinky_up',
    hint: 'Hanya kelingking berdiri — seperti menelan pil kecil',
  },
  {
    id: 'rumah',
    kata: 'Rumah',
    emoji: '🏠',
    kategori: 'Kebutuhan',
    gesture: 'three',
    hint: 'Tiga jari membentuk atap segitiga rumah',
  },
  {
    id: 'bantuan',
    kata: 'Bantuan',
    emoji: '🤲',
    kategori: 'Kebutuhan',
    gesture: 'cup',
    hint: 'Tangan seperti mangkuk meminta bantuan',
  },
  {
    id: 'panas',
    kata: 'Panas',
    emoji: '🔥',
    kategori: 'Kebutuhan',
    gesture: 'claw',
    hint: 'Jari-jari melengkung ke atas seperti api',
  },
  {
    id: 'dingin',
    kata: 'Dingin',
    emoji: '🥶',
    kategori: 'Kebutuhan',
    gesture: 'fist',
    hint: 'Kepalan tangan gemetar seperti kedinginan',
  },

  // ── Keluarga ─────────────────────────────────────────────
  {
    id: 'ibu',
    kata: 'Ibu',
    emoji: '👩',
    kategori: 'Keluarga',
    gesture: 'five_open',
    hint: 'Tangan terbuka, ibu jari menyentuh pipi',
  },
  {
    id: 'ayah',
    kata: 'Ayah',
    emoji: '👨',
    kategori: 'Keluarga',
    gesture: 'thumbs_up',
    hint: 'Ibu jari ke atas, menyentuh dahi',
  },
  {
    id: 'anak',
    kata: 'Anak',
    emoji: '👶',
    kategori: 'Keluarga',
    gesture: 'cup',
    hint: 'Tangan seperti menggendong bayi',
  },
  {
    id: 'teman',
    kata: 'Teman',
    emoji: '👫',
    kategori: 'Keluarga',
    gesture: 'crossed',
    hint: 'Dua jari bersilang seperti bersahabat',
  },

  // ── Tempat ───────────────────────────────────────────────
  {
    id: 'sekolah',
    kata: 'Sekolah',
    emoji: '🏫',
    kategori: 'Tempat',
    gesture: 'four',
    hint: 'Empat jari lurus ke atas seperti gedung',
  },
  {
    id: 'rumah_sakit',
    kata: 'Rumah Sakit',
    emoji: '🏥',
    kategori: 'Tempat',
    gesture: 'horns',
    hint: 'Telunjuk + kelingking membentuk tanda plus (+)',
  },
  {
    id: 'pasar',
    kata: 'Pasar',
    emoji: '🛒',
    kategori: 'Tempat',
    gesture: 'gun',
    hint: 'Telunjuk + ibu jari menunjuk ke depan',
  },
];

/**
 * Semua kategori unik dari kamus
 */
const ALL_CATEGORIES = ['Semua', ...new Set(WORD_DICTIONARY.map(w => w.kategori))];
