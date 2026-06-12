import { CLUBS, PLAYERS, MANAGERS, QUIZ_DATA } from '../data/dataset.js';
import { CAREERS } from '../data/careers.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { normalize, dailySeed, pickFromSeed, mulberry32, hashStr,
         showToast, playSound, getParam, setParam } from './utils.js';

const API_URL = '/api/leaderboard';

// -------- State
let currentGameMode = localStorage.getItem('fw_mode') || 'club';
let stats = JSON.parse(localStorage.getItem('fw_stats')) || {
  played: 0, wins: 0, streak: 0, maxStreak: 0, totalScore: 0,
  dailyStreak: 0, lastDaily: null, hintsUsed: 0,
  winsNoHint: 0, blitzBest: 0, duelWins: 0, careerWins: 0, badges: []
};
// Eski kayıtlarda eksik alanları doldur
['winsNoHint','blitzBest','duelWins','careerWins'].forEach(k => stats[k] = stats[k]||0);
stats.badges = stats.badges || [];

let username = localStorage.getItem('fw_username');
let userUuid = localStorage.getItem('fw_uuid') || (()=>{
  const u = crypto.randomUUID(); localStorage.setItem('fw_uuid', u); return u;
})();

let targetWord = '', rawTarget = '', currentRow = 0, currentLetterIndex = 0;
let gameOver = false, guesses = [], hintsLeft = 3, revealedPositions = new Set();
let quizCurrent = null, quizLocked = false, quizTimer = null;
let blitzActive = false, blitzScore = 0, blitzTimeLeft = 60, blitzInterval = null;
let resultEmojis = [];
let careerCurrent = null;

// Düello state
let duelSeed = null, duelRound = 0, duelTotal = 5, duelMyScore = 0, duelStart = 0, duelRng = null;
const DUEL_LIST = [...CLUBS, ...PLAYERS, ...MANAGERS];

// -------- Init / Mode
const board = () => document.getElementById('game-board');
const loginOverlay = () => document.getElementById('login-overlay');
const usernameInput = () => document.getElementById('username-input');

window.switchMode = function(mode) {
  if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }
  if (mode !== 'duel') setParam('duel', null);
  localStorage.setItem('fw_mode', mode);
  currentGameMode = mode;
  init();
};

window.registerUser = function() {
  const v = usernameInput().value.trim();
  if (!v) return;
  username = v;
  localStorage.setItem('fw_username', v);
  loginOverlay().style.display = 'none';
};

window.toggleStats = function() {
  const ov = document.getElementById('stats-overlay');
  if (ov.style.display === 'flex') { ov.style.display = 'none'; return; }
  document.getElementById('stats-played').textContent = stats.played;
  document.getElementById('stats-score').textContent = stats.totalScore;
  document.getElementById('stats-streak').textContent = stats.streak;
  document.getElementById('stats-max').textContent = stats.maxStreak;
  document.getElementById('stats-daily').textContent = stats.dailyStreak || 0;
  document.getElementById('stats-winrate').textContent =
    stats.played ? Math.round(100*stats.wins/stats.played) + '%' : '0%';
  document.getElementById('stats-duels').textContent = stats.duelWins || 0;
  document.getElementById('stats-blitz').textContent = stats.blitzBest || 0;
  renderBadges();
  loadLeaderboard();
  ov.style.display = 'flex';
};

window.toggleMute = function() {
  const m = localStorage.getItem('fw_muted') === '1';
  localStorage.setItem('fw_muted', m ? '0' : '1');
  document.getElementById('mute-btn').classList.toggle('muted', !m);
};

window.toggleTheme = function() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fw_theme', next);
};

function init() {
  // Tema
  const theme = localStorage.getItem('fw_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  // Düello URL parametresi → otomatik düello modu
  const d = getParam('duel');
  if (d && currentGameMode !== 'duel') {
    currentGameMode = 'duel';
  }

  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mode-${currentGameMode}`)?.classList.add('active');

  const wordleEl = document.getElementById('wordle-content');
  const quizEl = document.getElementById('quiz-container');
  const blitzEl = document.getElementById('blitz-bar');
  const careerEl = document.getElementById('career-clue');
  const duelEl = document.getElementById('duel-bar');
  wordleEl.style.display = 'none';
  quizEl.style.display = 'none';
  blitzEl.style.display = 'none';
  careerEl.style.display = 'none';
  duelEl.style.display = 'none';

  document.getElementById('mute-btn').classList.toggle('muted', localStorage.getItem('fw_muted') === '1');

  if (currentGameMode === 'quiz') {
    quizEl.style.display = 'flex';
    document.getElementById('game-subtitle').textContent = 'LOGOYU TAHMİN ET';
    loadQuiz();
  } else if (currentGameMode === 'daily') {
    setupWordle('daily');
    wordleEl.style.display = 'flex';
  } else if (currentGameMode === 'blitz') {
    startBlitz();
    wordleEl.style.display = 'flex';
    blitzEl.style.display = 'flex';
  } else if (currentGameMode === 'career') {
    setupCareer();
    wordleEl.style.display = 'flex';
    careerEl.style.display = 'flex';
  } else if (currentGameMode === 'duel') {
    startDuel(d);
    wordleEl.style.display = 'flex';
    duelEl.style.display = 'flex';
  } else {
    setupWordle(currentGameMode);
    wordleEl.style.display = 'flex';
  }

  if (!username) { loginOverlay().style.display = 'flex'; usernameInput().focus(); }
}

function setupWordle(mode) {
  gameOver = false;
  currentRow = 0;
  currentLetterIndex = 0;
  hintsLeft = 3;
  revealedPositions = new Set();
  resultEmojis = [];

  let list, subtitle;
  if (mode === 'player') { list = PLAYERS; subtitle = 'OYUNCUYU BUL'; }
  else if (mode === 'manager') { list = MANAGERS; subtitle = 'TEKNİK DİREKTÖRÜ BUL'; }
  else if (mode === 'daily') { list = [...CLUBS, ...PLAYERS, ...MANAGERS]; subtitle = 'GÜNÜN KELİMESİ'; }
  else { list = CLUBS; subtitle = 'KULÜBÜ BUL'; }

  if (mode === 'daily') rawTarget = pickFromSeed(list, dailySeed());
  else rawTarget = list[Math.floor(Math.random() * list.length)];

  targetWord = normalize(rawTarget);
  guesses = Array.from({length: 6}, () => []);
  document.getElementById('game-subtitle').textContent = subtitle;
  updateInfoBar();
  initBoard();
  document.querySelectorAll('.key').forEach(k => k.removeAttribute('data-state'));
}

// -------- Kariyer modu
function setupCareer() {
  gameOver = false; currentRow = 0; currentLetterIndex = 0;
  hintsLeft = 3; revealedPositions = new Set(); resultEmojis = [];
  careerCurrent = CAREERS[Math.floor(Math.random() * CAREERS.length)];
  rawTarget = careerCurrent.player;
  targetWord = normalize(rawTarget);
  guesses = Array.from({length: 6}, () => []);
  document.getElementById('game-subtitle').textContent = 'KARİYERDEN OYUNCUYU BUL';
  document.getElementById('career-clue').innerHTML =
    '📜 ' + careerCurrent.clubs.map(c => `<span class="career-club">${c}</span>`).join(' → ');
  updateInfoBar();
  initBoard();
  document.querySelectorAll('.key').forEach(k => k.removeAttribute('data-state'));
}

// -------- Düello modu
window.startNewDuel = function() {
  const seed = Math.floor(Math.random()*1e9).toString(36);
  setParam('duel', seed);
  currentGameMode = 'duel';
  init();
};

window.copyDuelLink = async function() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showToast('LİNK KOPYALANDI - arkadaşına gönder!');
  } catch(e) { showToast('Kopyalanamadı'); }
};

function startDuel(seedStr) {
  if (!seedStr) {
    seedStr = Math.floor(Math.random()*1e9).toString(36);
    setParam('duel', seedStr);
  }
  duelSeed = seedStr;
  duelRound = 0;
  duelMyScore = 0;
  duelStart = Date.now();
  duelRng = mulberry32(hashStr(seedStr));
  document.getElementById('game-subtitle').textContent = 'DÜELLO — ' + duelTotal + ' KELİME';
  document.getElementById('duel-code').textContent = '#' + seedStr;
  updateDuelBar();
  nextDuelRound();
}

function nextDuelRound() {
  if (duelRound >= duelTotal) return finishDuel();
  duelRound++;
  gameOver = false; currentRow = 0; currentLetterIndex = 0;
  hintsLeft = 3; revealedPositions = new Set(); resultEmojis = [];
  const idx = Math.floor(duelRng() * DUEL_LIST.length);
  rawTarget = DUEL_LIST[idx];
  targetWord = normalize(rawTarget);
  guesses = Array.from({length: 6}, () => []);
  updateInfoBar();
  initBoard();
  document.querySelectorAll('.key').forEach(k => k.removeAttribute('data-state'));
  updateDuelBar();
}

function updateDuelBar() {
  document.getElementById('duel-round').textContent = `${duelRound}/${duelTotal}`;
  document.getElementById('duel-score').textContent = duelMyScore;
}

function finishDuel() {
  const elapsed = Math.round((Date.now() - duelStart)/1000);
  stats.duelWins = (stats.duelWins||0) + 1;
  stats.totalScore += duelMyScore;
  saveStats(); checkAchievements(); syncScore();
  const ov = document.getElementById('end-overlay');
  document.getElementById('end-title').textContent = '⚔️ DÜELLO BİTTİ';
  document.getElementById('end-answer').textContent = `${duelMyScore} puan · ${elapsed}s`;
  document.getElementById('end-share-grid').textContent =
    `Düello #${duelSeed}\n${duelMyScore} puan / ${duelTotal} kelime / ${elapsed}s\nArkadaşının skorunu sor!`;
  ov.style.display = 'flex';
}

// -------- Tahta
function initBoard() {
  const b = board();
  b.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.className = 'row'; row.id = 'row-' + i;
    for (let j = 0; j < targetWord.length; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile'; tile.id = `tile-${i}-${j}`;
      row.appendChild(tile);
    }
    b.appendChild(row);
  }
}

function updateInfoBar() {
  document.getElementById('info-length').textContent = targetWord.length;
  document.getElementById('hints-left').textContent = hintsLeft;
}

// -------- İpucu
window.useHint = function() {
  if (gameOver || hintsLeft <= 0) return;
  const positions = [];
  for (let i = 0; i < targetWord.length; i++) if (!revealedPositions.has(i)) positions.push(i);
  if (!positions.length) return;
  const pos = positions[Math.floor(Math.random() * positions.length)];
  revealedPositions.add(pos);
  hintsLeft--;
  stats.hintsUsed = (stats.hintsUsed || 0) + 1;
  saveStats();
  updateInfoBar();
  const tile = document.getElementById(`tile-${currentRow}-${pos}`);
  if (tile && !tile.textContent) { tile.classList.add('hint'); tile.textContent = targetWord[pos]; }
  showToast(`İPUCU: "${targetWord[pos]}" → pozisyon ${pos+1}`);
};

// -------- Input
function handleInput(key) {
  if (gameOver || currentGameMode === 'quiz' || document.activeElement === usernameInput()) return;
  if (key === 'ENTER') submitGuess();
  else if (key === 'BACKSPACE') {
    if (currentLetterIndex > 0) {
      currentLetterIndex--;
      guesses[currentRow].pop();
      updateWordleRow();
    }
  } else if (/^[A-Z]$/.test(key)) {
    if (currentLetterIndex < targetWord.length) {
      guesses[currentRow].push(key); currentLetterIndex++;
      playSound('type');
      updateWordleRow();
    }
  }
}
window.handleInput = handleInput;

function updateWordleRow() {
  const tiles = document.querySelectorAll(`#row-${currentRow} .tile`);
  guesses[currentRow].forEach((char, i) => {
    tiles[i].textContent = char;
    tiles[i].classList.add('pop');
    tiles[i].classList.remove('hint');
  });
  for (let i = guesses[currentRow].length; i < targetWord.length; i++) {
    if (revealedPositions.has(i)) { tiles[i].textContent = targetWord[i]; tiles[i].classList.add('hint'); }
    else { tiles[i].textContent = ''; }
    tiles[i].classList.remove('pop');
  }
}

function submitGuess() {
  const fullGuess = [];
  let gi = 0;
  for (let i = 0; i < targetWord.length; i++) {
    if (revealedPositions.has(i)) fullGuess.push(targetWord[i]);
    else fullGuess.push(guesses[currentRow][gi++] || '');
  }
  const guess = fullGuess.join('');
  const typed = guesses[currentRow].length;
  const expected = targetWord.length - revealedPositions.size;
  if (typed !== expected) return showToast("EKSİK HARF");

  guesses[currentRow] = fullGuess;
  const tiles = document.querySelectorAll(`#row-${currentRow} .tile`);
  const tArr = targetWord.split('');
  const states = new Array(targetWord.length).fill('absent');
  fullGuess.forEach((c, i) => { if (c === tArr[i]) { states[i] = 'correct'; tArr[i] = null; } });
  fullGuess.forEach((c, i) => {
    if (states[i] !== 'correct') {
      const idx = tArr.indexOf(c);
      if (idx !== -1) { states[i] = 'present'; tArr[idx] = null; }
    }
  });
  states.forEach((s, i) => setTimeout(() => {
    tiles[i].classList.remove('hint');
    tiles[i].setAttribute('data-state', s);
    playSound(s);
    const kk = document.querySelector(`.key[data-key="${fullGuess[i]}"]`);
    if (kk) {
      const cur = kk.getAttribute('data-state');
      if (cur !== 'correct' && !(cur === 'present' && s === 'absent')) kk.setAttribute('data-state', s);
    }
  }, i * 100));
  resultEmojis.push(states.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join(''));

  const won = guess === targetWord;
  if (won) {
    gameOver = true;
    const baseScore = 20 + (5 - currentRow) * 5;
    const penalty = (3 - hintsLeft) * 3;
    const score = Math.max(5, baseScore - penalty);

    if (currentGameMode === 'duel') {
      duelMyScore += score;
      updateDuelBar();
      setTimeout(nextDuelRound, 900);
    } else {
      stats.totalScore += score;
      stats.streak++; stats.wins++;
      if (hintsLeft === 3) stats.winsNoHint = (stats.winsNoHint||0) + 1;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      if (currentGameMode === 'career') stats.careerWins = (stats.careerWins||0) + 1;
      if (currentGameMode === 'daily') {
        const today = new Date().toDateString();
        if (stats.lastDaily !== today) {
          stats.dailyStreak = (stats.dailyStreak || 0) + 1;
          stats.lastDaily = today;
        }
      }
      if (blitzActive) {
        blitzScore += score; updateBlitzScore();
        setTimeout(() => setupWordle('blitz'), 800);
      } else {
        showToast(`GOL! +${score} PUAN`);
        playSound('win');
        setTimeout(() => showEndGame(true), 1500);
      }
    }
  } else if (currentRow === 5) {
    gameOver = true;
    if (currentGameMode === 'duel') {
      setTimeout(() => { showToast('Cevap: ' + rawTarget); setTimeout(nextDuelRound, 1200); }, 600);
    } else {
      stats.streak = 0;
      playSound('lose');
      if (blitzActive) setTimeout(() => setupWordle('blitz'), 800);
      else { showToast("MAÇ BİTTİ: " + rawTarget); setTimeout(() => showEndGame(false), 1500); }
    }
  } else {
    currentRow++;
    currentLetterIndex = 0;
  }

  stats.played++;
  saveStats(); checkAchievements(); syncScore();
}

function showEndGame(won) {
  const ov = document.getElementById('end-overlay');
  document.getElementById('end-title').textContent = won ? '🎉 KAZANDIN!' : '😔 KAYBETTİN';
  document.getElementById('end-answer').textContent = rawTarget;
  document.getElementById('end-share-grid').textContent = resultEmojis.join('\n');
  ov.style.display = 'flex';
}

window.closeEndGame = function() {
  document.getElementById('end-overlay').style.display = 'none';
  if (currentGameMode === 'career') setupCareer();
  else if (currentGameMode === 'duel') startNewDuel();
  else setupWordle(currentGameMode);
};

window.shareResult = async function() {
  let text;
  if (currentGameMode === 'duel') {
    text = `⚔️ Football Hub Düello #${duelSeed}\nSkorum: ${duelMyScore} / ${duelTotal} kelime\nSen de oyna: ${window.location.href}`;
  } else {
    const tag = currentGameMode === 'daily' ? '(Daily)' :
                currentGameMode === 'career' ? '(Kariyer)' : '';
    text = `Football Hub ${tag}\n${rawTarget} - ${currentRow + 1}/6\n\n${resultEmojis.join('\n')}\n\n${window.location.origin}`;
  }
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); showToast("KOPYALANDI!"); }
  } catch(e) { showToast("PAYLAŞIM İPTAL"); }
};

// -------- Blitz
function startBlitz() {
  blitzActive = true; blitzScore = 0; blitzTimeLeft = 60;
  setupWordle('blitz');
  updateBlitzScore();
  blitzInterval = setInterval(() => {
    blitzTimeLeft--;
    const tEl = document.getElementById('blitz-time');
    tEl.textContent = blitzTimeLeft;
    if (blitzTimeLeft <= 10) tEl.classList.add('danger');
    if (blitzTimeLeft <= 0) endBlitz();
  }, 1000);
}
function updateBlitzScore() { document.getElementById('blitz-score').textContent = blitzScore; }
function endBlitz() {
  clearInterval(blitzInterval); blitzInterval = null; blitzActive = false;
  stats.totalScore += blitzScore;
  if (blitzScore > (stats.blitzBest||0)) stats.blitzBest = blitzScore;
  saveStats(); checkAchievements(); syncScore();
  showToast(`BLİTZ BİTTİ! +${blitzScore} PUAN`);
  setTimeout(() => { document.getElementById('blitz-bar').style.display = 'none'; switchMode('club'); }, 2500);
}

// -------- Quiz
function loadQuiz() {
  if (quizTimer) clearTimeout(quizTimer);
  quizLocked = false;
  quizCurrent = QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)];
  const logo = document.getElementById('quiz-logo');
  logo.src = quizCurrent.logo;
  logo.classList.add('blurred');
  const options = [quizCurrent.name];
  while (options.length < 4) {
    const r = QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)].name;
    if (!options.includes(r)) options.push(r);
  }
  options.sort(() => Math.random() - 0.5);
  document.getElementById('quiz-options').innerHTML =
    options.map(o => `<button class="option-btn" onclick="checkQuiz('${o.replace(/'/g,"\\'")}', this)">${o}</button>`).join('');
}
window.checkQuiz = function(choice, btn) {
  if (quizLocked) return;
  quizLocked = true;
  const correct = choice === quizCurrent.name;
  document.getElementById('quiz-logo').classList.remove('blurred');
  if (correct) { btn.classList.add('correct'); stats.totalScore += 5; playSound('correct'); showToast("+5 PUAN!"); }
  else {
    btn.classList.add('wrong'); playSound('absent');
    showToast("YANLIŞ: " + quizCurrent.name);
    document.querySelectorAll('.option-btn').forEach(b => { if (b.textContent === quizCurrent.name) b.classList.add('correct'); });
  }
  stats.played++;
  saveStats(); checkAchievements(); syncScore();
  quizTimer = setTimeout(loadQuiz, 2000);
};

// -------- Rozetler
function checkAchievements() {
  let newOnes = [];
  for (const a of ACHIEVEMENTS) {
    if (!stats.badges.includes(a.id) && a.unlock(stats)) {
      stats.badges.push(a.id);
      newOnes.push(a);
    }
  }
  if (newOnes.length) {
    saveStats();
    newOnes.forEach((a, i) => setTimeout(() => popBadge(a), i * 1800));
  }
}
function popBadge(a) {
  playSound('badge');
  const el = document.getElementById('badge-pop');
  el.innerHTML = `<div class="badge-icon">${a.icon}</div>
    <div><div class="badge-name">ROZET AÇILDI: ${a.name}</div>
    <div class="badge-desc">${a.desc}</div></div>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}
function renderBadges() {
  const wrap = document.getElementById('badges-grid');
  wrap.innerHTML = ACHIEVEMENTS.map(a => {
    const got = stats.badges.includes(a.id);
    return `<div class="badge-card ${got?'unlocked':'locked'}" title="${a.desc}">
      <div class="b-icon">${got?a.icon:'🔒'}</div>
      <div class="b-name">${a.name}</div>
    </div>`;
  }).join('');
}

// -------- Persistence & Network
function saveStats() { localStorage.setItem('fw_stats', JSON.stringify(stats)); }
async function syncScore() {
  if (!username) return;
  try {
    await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: username, score: stats.totalScore, uuid: userUuid }) });
  } catch(e) {}
}
async function loadLeaderboard() {
  const list = document.getElementById('leaderboard');
  list.innerHTML = '<div class="lb-empty">Yükleniyor...</div>';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data || !data.length) { list.innerHTML = '<div class="lb-empty">Henüz skor yok</div>'; return; }
    list.innerHTML = data.map((l, i) =>
      `<div class="leaderboard-item ${l.uuid === userUuid ? 'highlight' : ''}">
         <span><span class="rank">${i+1}</span> ${escapeHtml(l.name)}</span>
         <span style="font-weight:800">${l.score}</span>
       </div>`).join('');
  } catch(e) { list.innerHTML = '<div class="lb-empty">Skor tablosu şu an kullanılamıyor</div>'; }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// -------- Listeners
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleInput('ENTER');
  else if (e.key === 'Backspace') handleInput('BACKSPACE');
  else if (/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) handleInput(normalize(e.key));
});
document.addEventListener('click', e => {
  const k = e.target.closest('.key');
  if (k) handleInput(k.dataset.key);
});
usernameInput()?.addEventListener('keydown', e => { if (e.key === 'Enter') window.registerUser(); });

// -------- Go
init();
