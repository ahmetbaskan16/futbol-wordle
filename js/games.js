/**
 * Futbol Wordle - Games Logic
 */

class WordleGame {
  constructor(mode = 'club') {
    this.mode = mode;
    // Mod bazlı kelime listesi
    if (mode === 'club') {
      this.words = [
        'FENERBAHCE', 'GALATASARAY', 'BESIKTAS', 'TRABZONSPOR', 
        'BURSASPOR', 'ANTALYASPOR', 'SIVASSPOR', 'REALMADRID', 
        'BARCELONA', 'MANCHESTER', 'LIVERPOOL', 'CHELSEA', 
        'ARSENAL', 'BAYERN', 'JUVENTUS', 'PSG', 'MILAN', 
        'INTER', 'ATLETICO'
      ];
    } else {
      // Oyuncu modu
      this.words = [
        'MESSI', 'RONALDO', 'NEYMAR', 'MBAPPE', 'HAALAND',
        'SALAH', 'KANE', 'LEWANDOWSKI', 'BENZEMA', 'BRUYNE',
        'MODRIC', 'KROOS', 'CASEMIRO', 'KANTE', 'SILVA',
        'SZYCHESNY', 'DONNARUMMA', 'ALISSON', 'COURTOIS'
      ];
    }
    
    this.targetWord = this.words[Math.floor(Math.random() * this.words.length)].toUpperCase();
    this.maxAttempts = 6;
    this.currentAttempt = 0;
    this.currentGuess = '';
    this.gameOver = false;
    
    this.container = document.getElementById('game-container');
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.setupKeyboard();
  }

  render() {
    this.container.innerHTML = '';
    
    const title = document.createElement('h2');
    title.style.cssText = 'text-align:center;margin-bottom:24px;color:#f3f4f6';
    title.textContent = this.mode === 'club' ? '🏟️ Kulüp Wordle' : '👤 Oyuncu Wordle';
    this.container.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:24px';
    
    for (let i = 0; i < this.maxAttempts; i++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.style.cssText = 'display:flex;gap:8px';
      for (let j = 0; j < this.targetWord.length; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${i}-${j}`;
        tile.style.cssText = `
          width:48px;height:56px;border:2px solid rgba(255,255,255,0.2);
          border-radius:8px;display:flex;align-items:center;
          justify-content:center;font-size:1.5rem;font-weight:700;
          background:rgba(255,255,255,0.05);transition:all 0.2s;
        `;
        row.appendChild(tile);
      }
      grid.appendChild(row);
    }
    this.container.appendChild(grid);
    
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard';
    keyboard.id = 'keyboard';
    keyboard.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px';
    this.container.appendChild(keyboard);
  }

  setupKeyboard() {
    const keyboard = document.getElementById('keyboard');
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    
    rows.forEach(rowString => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';
      rowEl.style.cssText = 'display:flex;gap:6px';
      
      [...rowString].forEach(char => {
        const key = this.createKey(char);
        key.onclick = () => this.handleInput(char);
        rowEl.appendChild(key);
      });
      keyboard.appendChild(rowEl);
    });
    
    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'display:flex;gap:6px';
    
    const enterKey = this.createKey('ENTER', 'wide');
    enterKey.onclick = () => this.handleEnter();
    bottomRow.appendChild(enterKey);
    
    const backKey = this.createKey('←', 'wide');
    backKey.onclick = () => this.handleBackspace();
    bottomRow.appendChild(backKey);
    keyboard.appendChild(bottomRow);
    
    this._keydownHandler = (e) => {
      if (this.gameOver) return;
      if (e.key === 'Enter') this.handleEnter();
      else if (e.key === 'Backspace') this.handleBackspace();
      else if (/^[a-zA-Z]$/.test(e.key)) this.handleInput(e.key.toUpperCase());
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  createKey(label, className = '') {
    const key = document.createElement('button');
    key.className = `key ${className}`;
    key.textContent = label;
    key.style.cssText = `
      min-width:36px;height:52px;padding:0 12px;background:rgba(255,255,255,0.1);
      border:none;border-radius:8px;color:#f3f4f6;font-weight:600;
      cursor:pointer;transition:all 0.15s;
    `;
    if (className === 'wide') key.style.minWidth = '70px';
    return key;
  }

  handleInput(char) {
    if (this.gameOver || this.currentGuess.length >= this.targetWord.length) return;
    this.currentGuess += char;
    this.updateTiles();
  }

  handleBackspace() {
    if (this.gameOver || this.currentGuess.length === 0) return;
    this.currentGuess = this.currentGuess.slice(0, -1);
    this.updateTiles();
  }

  updateTiles() {
    for (let j = 0; j < this.targetWord.length; j++) {
      const tile = document.getElementById(`tile-${this.currentAttempt}-${j}`);
      if (tile) {
        tile.textContent = this.currentGuess[j] || '';
        tile.style.background = this.currentGuess[j] ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
      }
    }
  }

  handleEnter() {
    if (this.gameOver) return;
    if (this.currentGuess.length !== this.targetWord.length) {
      for (let j = 0; j < this.targetWord.length; j++) {
        const tile = document.getElementById(`tile-${this.currentAttempt}-${j}`);
        if (tile) {
          tile.style.animation = 'shake 0.5s';
          setTimeout(() => tile.style.animation = '', 500);
        }
      }
      return;
    }
    this.checkGuess();
  }

  checkGuess() {
    const guess = this.currentGuess;
    const target = this.targetWord;
    const rowTiles = [];
    
    for (let j = 0; j < target.length; j++) {
      rowTiles.push(document.getElementById(`tile-${this.currentAttempt}-${j}`));
    }
    
    const targetLetterCount = {};
    for (const char of target) {
      targetLetterCount[char] = (targetLetterCount[char] || 0) + 1;
    }
    
    guess.split('').forEach((char, i) => {
      if (char === target[i]) {
        rowTiles[i].classList.add('correct');
        rowTiles[i].style.background = '#10b981';
        rowTiles[i].style.borderColor = '#10b981';
        targetLetterCount[char]--;
      }
    });
    
    guess.split('').forEach((char, i) => {
      if (char !== target[i]) {
        if (targetLetterCount[char] > 0) {
          rowTiles[i].classList.add('present');
          rowTiles[i].style.background = '#f59e0b';
          rowTiles[i].style.borderColor = '#f59e0b';
          targetLetterCount[char]--;
        } else {
          rowTiles[i].classList.add('absent');
          rowTiles[i].style.background = 'rgba(255,255,255,0.05)';
          rowTiles[i].style.color = '#6b7280';
        }
      }
    });
    
    this.currentAttempt++;
    this.currentGuess = '';
    
    if (guess === target) {
      this.gameOver = true;
      const xp = (this.maxAttempts - this.currentAttempt + 1) * 50;
      if (window.app) {
        window.app.addWin('wordle');
        window.app.addXP(xp);
        
        // Save win to leaderboard (fail silently)
        const userData = window.app.user;
        if (userData) {
          fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userData.username || 'Misafir',
              score: userData.xp,
              level: userData.level
            })
          }).catch(() => {});
        }
      }
      setTimeout(() => this.showResult(true, xp), 500);
    } else if (this.currentAttempt >= this.maxAttempts) {
      this.gameOver = true;
      if (window.app) window.app.addLoss();
      setTimeout(() => this.showResult(false, 0), 500);
    }
  }

  showResult(won, xp) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.8);display:flex;align-items:center;
      justify-content:center;z-index:1000;
    `;
    overlay.innerHTML = `
      <div style="background:#1f2937;padding:40px;border-radius:24px;text-align:center;max-width:400px;color:white">
        <div style="font-size:4rem;margin-bottom:16px">${won ? '🎉' : '😔'}</div>
        <h2 style="margin-bottom:16px">${won ? 'Tebrikler!' : 'Oyun Bitti'}</h2>
        ${won ? `<p style="color:#fbbf24;font-size:1.5rem;margin-bottom:16px">⚡ +${xp} XP</p>` : `<p>Doğru kelime: <strong>${this.targetWord}</strong></p>`}
        <button onclick="location.reload()" style="
          padding:14px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:none;border-radius:9999px;color:white;font-weight:600;cursor:pointer
        ">🔄 Tekrar Oyna</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}
