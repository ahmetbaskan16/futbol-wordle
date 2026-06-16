/**
 * Futbol Wordle - Games Logic
 */

class WordleGame {
    constructor() {
        this.words = ['FENERBAHCE', 'GALATASARAY', 'BESIKTAS', 'TRABZONSPOR', 'BURSASPOR', 'MESSI', 'RONALDO', 'NEYMAR', 'MBAPPE', 'HAALAND', 'SALAH', 'KANE', 'LEWANDOWSKI'];
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
        const grid = document.createElement('div');
        grid.className = 'grid';
        
        for (let i = 0; i < this.maxAttempts; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < this.targetWord.length; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            grid.appendChild(row);
        }
        
        this.container.appendChild(grid);
        
        const keyboard = document.createElement('div');
        keyboard.className = 'keyboard';
        keyboard.id = 'keyboard';
        this.container.appendChild(keyboard);
    }

    setupKeyboard() {
        const keyboard = document.getElementById('keyboard');
        const rows = [
            'ERTÜIOPĞÜ',
            'ASDFGHJKLŞİ',
            'ZXCVBNMÖÇ'
        ];
        
        // Add special keys row
        const bottomRow = document.createElement('div');
        bottomRow.className = 'keyboard-row';
        
        const enterKey = this.createKey('ENTER', 'wide');
        enterKey.onclick = () => this.handleEnter();
        bottomRow.appendChild(enterKey);
        
        const backKey = this.createKey('←', 'wide');
        backKey.onclick = () => this.handleBackspace();
        bottomRow.appendChild(backKey);
        
        rows.forEach(rowString => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            rowString.split('').forEach(char => {
                const key = this.createKey(char);
                key.onclick = () => this.handleInput(char);
                rowEl.appendChild(key);
            });
            keyboard.appendChild(rowEl);
        });
        
        keyboard.appendChild(bottomRow);
        
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            if (e.key === 'Enter') this.handleEnter();
            else if (e.key === 'Backspace') this.handleBackspace();
            else if (/^[a-zA-ZçÇğĞıİöÖşŞüÜ]$/.test(e.key)) this.handleInput(e.key.toUpperCase());
        });
    }

    createKey(label, className = '') {
        const key = document.createElement('button');
        key.className = `key ${className}`;
        key.textContent = label;
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
            tile.textContent = this.currentGuess[j] || '';
        }
    }

    handleEnter() {
        if (this.gameOver) return;
        if (this.currentGuess.length !== this.targetWord.length) {
            alert('Kelime tamamlanmadı!');
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

        let correctCount = 0;
        const targetLetterCount = {};
        for (const char of target) {
            targetLetterCount[char] = (targetLetterCount[char] || 0) + 1;
        }

        // First pass: Green
        guess.split('').forEach((char, i) => {
            if (char === target[i]) {
                rowTiles[i].classList.add('correct');
                targetLetterCount[char]--;
                correctCount++;
            }
        });

        // Second pass: Yellow and Gray
        guess.split('').forEach((char, i) => {
            if (char !== target[i]) {
                if (targetLetterCount[char] > 0) {
                    rowTiles[i].classList.add('present');
                    targetLetterCount[char]--;
                } else {
                    rowTiles[i].classList.add('absent');
                }
            }
        });

        if (correctCount === target.length) {
            this.gameOver = true;
            if (window.app) {
                window.app.addXP(100);
                window.app.addWin('wordle');
            }
            alert('TEBRİKLER! Bildiniz.');
        } else {
            this.currentAttempt++;
            this.currentGuess = '';
            if (this.currentAttempt >= this.maxAttempts) {
                this.gameOver = true;
                if (window.app) window.app.addLoss();
                alert(`OYUN BİTTİ! Doğru cevap: ${this.targetWord}`);
            }
        }
    }
}