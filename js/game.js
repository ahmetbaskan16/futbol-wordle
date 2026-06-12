import { CLUBS, PLAYERS, MANAGERS, QUIZ_DATA } from '../data/dataset.js';
import { normalize, dailySeed, pickFromSeed, showToast, playSound } from './utils.js';

const API_URL = '/api/leaderboard';

// -------- State
let currentGameMode = localStorage.getItem('fw_mode') || 'club';
let stats = JSON.parse(localStorage.getItem('fw_stats')) || {
  played: 0, wins: 0, streak: 0, maxStreak: 0, totalScore: 0,
  dailyStreak: 0, lastDaily: null, hintsUsed: 0
};
let username = localStorage.getItem('fw_username');
let userUuid = localStorage.getItem('fw_uuid') || (()=>{
  const u = crypto.randomUUID(); localStorage.setItem('fw_uuid', u); return u;
})();

let targetWord = '', rawTarget = '', currentRow = 0, currentLetterIndex = 0;
let gameOver = false, guesses = [], hintsLeft = 3, revealedPositions = new Set();
let quizCurrent = null, quizLocked = false, quizTimer = null;
let blitzActive = false, blitzScore = 0, blitzTimeLeft = 60, blitzInterval = null;
let resultEmojis = []; // share grid

// -------- UI Refs
const board = () => document.getElementById('game-board');
const loginOverlay = () => document.getElementById('login-overlay');
const usernameInput = () => document.getElementById('username-input');

// -------- Mode
window.switchMode = function(mode) {
  if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }
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
  loadLeaderboard();
  ov.style.display = 'flex';
};

window.toggleMute = function() {
  const m = localStorage.getItem('fw_muted') === '1';
  localStorage.setItem('fw_muted', m ? '0' : '1');
  document.getElementById('mute-btn').classList.toggle('muted', !m);
};

// -------- Init
function init() {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mode-${currentGameMode}`)?.classList.add('active');

  const wordleEl = document.getElementById('wordle-content');
  const quizEl = document.getElementById('quiz-container');
  const blitzEl = document.getElementById('blitz-bar');
  wordleEl.style.display = 'none';
  quizEl.style.display = 'none';
  blitzEl.style.display = 'none';

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

  let list;
  let subtitle;
  if (mode === 'player') { list = PLAYERS; subtitle = 'OYUNCUYU BUL'; }
  else if (mode === 'manager') { list = MANAGERS; subtitle = 'TEKNİK DİREKTÖRÜ BUL'; }
  else if (mode === 'daily') { list = [...CLUBS, ...PLAYERS, ...MANAGERS]; subtitle = 'GÜNÜN KELİMESİ'; }
  else { list = CLUBS; subtitle = 'KULÜBÜ BUL'; }

  if (mode === 'daily') {
    rawTarget = pickFromSeed(list, dailySeed());
  } else {
    rawTarget = list[Math.floor(Math.random() * list.length)];
  }
  targetWord = normalize(rawTarget);
  guesses = Array.from({length: 6}, () => []);

  document.getElementById('game-subtitle').textContent = subtitle;
  document.getElementById('hints-left').textContent = hintsLeft;
  updateInfoBar();
  initBoard();

  // Reset keyboard colors
  document.querySelectorAll('.key').forEach(k => k.removeAttribute('data-state'));
}

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

// -------- Hint
window.useHint = function() {
  if (gameOver || hintsLeft <= 0) return;
  // Find an unrevealed position
  const positions = [];
  for (let i = 0; i < targetWord.length; i++) {
    if (!revealedPositions.has(i)) positions.push(i);
  }
  if (positions.length === 0) return;
  const pos = positions[Math.floor(Math.random() * positions.length)];
  revealedPositions.add(pos);
  hintsLeft--;
  stats.hintsUsed = (stats.hintsUsed || 0) + 1;
  saveStats();
  updateInfoBar();
  // Show hint letter on current row at position
  const tile = document.getElementById(`tile-${currentRow}-${pos}`);
  if (tile && !tile.textContent) {
    tile.classList.add('hint');
    tile.textContent = targetWord[pos];
  }
  showToast(`İPUCU: "${targetWord[pos]}" harfi pozisyon ${pos+1}'de`);
};

// -------- Wordle input
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
      guesses[currentRow].push(key);
      currentLetterIndex++;
      playSound('type');
      updateWordleRow();
    }
  }
}
window.handleInput = handleInput;

function updateWordleRow() {
  const tiles = document.querySelectorAll(`#row-${currentRow} .tile`);
  // Preserve hint letters on empty positions
  guesses[currentRow].forEach((char, i) => {
    tiles[i].textContent = char;
    tiles[i].classList.add('pop');
    tiles[i].classList.remove('hint');
  });
  for (let i = guesses[currentRow].length; i < targetWord.length; i++) {
    if (revealedPositions.has(i)) {
      tiles[i].textContent = targetWord[i];
      tiles[i].classList.add('hint');
    } else {
      tiles[i].textContent = '';
    }
    tiles[i].classList.remove('pop');
  }
}

function submitGuess() {
  // Auto-fill revealed hint positions
  const fullGuess = [];
  let gi = 0;
  for (let i = 0; i < targetWord.length; i++) {
    if (revealedPositions.has(i)) fullGuess.push(targetWord[i]);
    else fullGuess.push(guesses[currentRow][gi++] || '');
  }
  const guess = fullGuess.join('');
  const userTypedCount = guesses[currentRow].length;
  const expectedTyped = targetWord.length - revealedPositions.size;
  if (userTypedCount !== expectedTyped) return showToast("EKSİK HARF");

  guesses[currentRow] = fullGuess; // commit
  const tiles = document.querySelectorAll(`#row-${currentRow} .tile`);
  const targetArr = targetWord.split('');
  const states = new Array(targetWord.length).fill('absent');

  fullGuess.forEach((char, i) => {
    if (char === targetArr[i]) { states[i] = 'correct'; targetArr[i] = null; }
  });
  fullGuess.forEach((char, i) => {
    if (states[i] !== 'correct') {
      const idx = targetArr.indexOf(char);
      if (idx !== -1) { states[i] = 'present'; targetArr[idx] = null; }
    }
  });

  states.forEach((s, i) => setTimeout(() => {
    tiles[i].classList.remove('hint');
    tiles[i].setAttribute('data-state', s);
    playSound(s);
    // Update keyboard
    const kk = document.querySelector(`.key[data-key="${fullGuess[i]}"]`);
    if (kk) {
      const cur = kk.getAttribute('data-state');
      if (cur !== 'correct' && !(cur === 'present' && s === 'absent')) {
        kk.setAttribute('data-state', s);
      }
    }
  }, i * 100));

  resultEmojis.push(states.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join(''));

  const won = guess === targetWord;
  if (won) {
    gameOver = true;
    const baseScore = 20 + (5 - currentRow) * 5;
    const penalty = (3 - hintsLeft) * 3;
    const score = Math.max(5, baseScore - penalty);
    stats.totalScore += score;
    stats.streak++;
    stats.wins++;
    if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
    if (currentGameMode === 'daily') {
      const today = new Date().toDateString();
      if (stats.lastDaily !== today) {
        stats.dailyStreak = (stats.dailyStreak || 0) + 1;
        stats.lastDaily = today;
      }
    }
    if (blitzActive) {
      blitzScore += score;
      updateBlitzScore();
      setTimeout(() => setupWordle('blitz'), 800);
    } else {
      showToast(`GOL! +${score} PUAN`);
      playSound('win');
      setTimeout(() => showEndGame(true), 1500);
    }
  } else if (currentRow === 5) {
    gameOver = true;
    stats.streak = 0;
    playSound('lose');
    if (blitzActive) {
      setTimeout(() => setupWordle('blitz'), 800);
    } else {
      showToast("MAÇ BİTTİ: " + rawTarget);
      setTimeout(() => showEndGame(false), 1500);
    }
  } else {
    currentRow++;
    currentLetterIndex = 0;
  }

  stats.played++;
  saveStats();
  syncScore();
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
  setupWordle(currentGameMode);
};

window.shareResult = async function() {
  const mode = currentGameMode === 'daily' ? '(Daily)' : '';
  const text = `Football Hub ${mode}\n${rawTarget} - ${currentRow + 1}/6\n\n${resultEmojis.join('\n')}\n\n${window.location.origin}`;
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast("KOPYALANDI!");
    }
  } catch(e) { showToast("PAYLAŞIM İPTAL"); }
};

// -------- Blitz
function startBlitz() {
  blitzActive = true;
  blitzScore = 0;
  blitzTimeLeft = 60;
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
function updateBlitzScore() {
  document.getElementById('blitz-score').textContent = blitzScore;
}
function endBlitz() {
  clearInterval(blitzInterval);
  blitzInterval = null;
  blitzActive = false;
  stats.totalScore += blitzScore;
  saveStats();
  syncScore();
  showToast(`BLİTZ BİTTİ! +${blitzScore} PUAN`);
  setTimeout(() => {
    document.getElementById('blitz-bar').style.display = 'none';
    switchMode('club');
  }, 2500);
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
  if (correct) {
    btn.classList.add('correct');
    stats.totalScore += 5;
    playSound('correct');
    showToast("+5 PUAN!");
  } else {
    btn.classList.add('wrong');
    playSound('absent');
    showToast("YANLIŞ: " + quizCurrent.name);
    document.querySelectorAll('.option-btn').forEach(b => {
      if (b.textContent === quizCurrent.name) b.classList.add('correct');
    });
  }
  stats.played++;
  saveStats(); syncScore();
  quizTimer = setTimeout(loadQuiz, 2000);
};

// -------- Persistence & Network
function saveStats() {
  localStorage.setItem('fw_stats', JSON.stringify(stats));
}

async function syncScore() {
  if (!username) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username, score: stats.totalScore, uuid: userUuid })
    });
  } catch(e) {}
}

async function loadLeaderboard() {
  const list = document.getElementById('leaderboard');
  list.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:20px;">Yükleniyor...</div>';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data || !data.length) {
      list.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:20px;">Henüz skor yok</div>';
      return;
    }
    list.innerHTML = data.map((l, i) =>
      `<div class="leaderboard-item ${l.uuid === userUuid ? 'highlight' : ''}">
         <span><span class="rank">${i+1}</span> ${escapeHtml(l.name)}</span>
         <span style="font-weight:800">${l.score}</span>
       </div>`
    ).join('');
  } catch(e) {
    list.innerHTML = '<div style="color:var(--text-secondary);text-align:center;padding:20px;">Skor tablosu şu an kullanılamıyor</div>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// -------- Keyboard listeners
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleInput('ENTER');
  else if (e.key === 'Backspace') handleInput('BACKSPACE');
  else if (/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key)) handleInput(normalize(e.key));
});
document.addEventListener('click', e => {
  const k = e.target.closest('.key');
  if (k) handleInput(k.dataset.key);
});
usernameInput()?.addEventListener('keydown', e => {
  if (e.key === 'Enter') window.registerUser();
});

// -------- Go
init();
