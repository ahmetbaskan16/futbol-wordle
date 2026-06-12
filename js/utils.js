// Yardımcı fonksiyonlar
export function normalize(str) {
  return str.toUpperCase()
    .replace(/[İIĞÜŞÖÇ]/g, m => ({'İ':'I','I':'I','Ğ':'G','Ü':'U','Ş':'S','Ö':'O','Ç':'C'}[m]))
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, '');
}

// Deterministik sayısal hash (seed üretimi için)
export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function dailySeed() {
  const d = new Date();
  return hashStr(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`);
}

export function pickFromSeed(arr, seed) {
  return arr[seed % arr.length];
}

// Mulberry32 PRNG — düello modunda her iki taraf için aynı sırayla kelime üretir
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function showToast(message, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// URL parametre yardımcıları (düello linki için)
export function getParam(k) {
  return new URLSearchParams(window.location.search).get(k);
}
export function setParam(k, v) {
  const u = new URL(window.location.href);
  if (v === null) u.searchParams.delete(k); else u.searchParams.set(k, v);
  history.replaceState({}, '', u);
}

// Basit ses sentezi
let audioCtx = null;
export function playSound(type) {
  if (localStorage.getItem('fw_muted') === '1') return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const freqs = { correct: 880, present: 660, absent: 220, win: [523, 659, 784, 1046], lose: 150, type: 400, badge: [659, 988] };
    if (Array.isArray(freqs[type])) {
      freqs[type].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 100));
      return;
    }
    beep(freqs[type] || 440, type === 'lose' ? 0.4 : 0.08);
  } catch(e) {}
}
function beep(freq, dur) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq; o.type = 'sine';
  o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
