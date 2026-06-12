// Yardımcı fonksiyonlar
export function normalize(str) {
  return str.toUpperCase()
    .replace(/[İIĞÜŞÖÇ]/g, m => ({'İ':'I','I':'I','Ğ':'G','Ü':'U','Ş':'S','Ö':'O','Ç':'C'}[m]))
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, '');
}

// Tarih bazlı tohum (Daily Challenge için) - aynı gün herkes aynı kelime
export function dailySeed() {
  const d = new Date();
  const s = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i) | 0;
  return Math.abs(hash);
}

export function pickFromSeed(arr, seed) {
  return arr[seed % arr.length];
}

export function showToast(message, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// Basit ses sentezi (Web Audio API) - dosyasız, hafif
let audioCtx = null;
export function playSound(type) {
  if (localStorage.getItem('fw_muted') === '1') return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const freqs = { correct: 880, present: 660, absent: 220, win: [523, 659, 784, 1046], lose: 150, type: 400 };
    if (type === 'win') {
      freqs.win.forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 100));
      return;
    }
    beep(freqs[type] || 440, type === 'lose' ? 0.4 : 0.08);
  } catch(e) {}
}
function beep(freq, dur) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  o.type = 'sine';
  o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
