/**
 * Futbol Wordle - Core App Logic
 * XP, Level, Stats, Missions, and UUID Management
 */

class FutbolWordleApp {
    constructor() {
        this.storageKey = 'fw_user_data';
        this.user = this.loadUser();
        this.init();
    }

    loadUser() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Generate a simple UUID for the session/user
        const uuid = 'user-' + Math.random().toString(36).substr(2, 9);
        
        return {
            uuid: uuid,
            username: 'Misafir',
            level: 1,
            xp: 0,
            stats: {
                totalGames: 0,
                wins: 0,
                currentStreak: 0,
                bestStreak: 0
            },
            missions: [],
            achievements: []
        };
    }

    saveUser() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.user));
        this.updateUI();
    }

    init() {
        this.updateUI();
    }

    updateUI() {
        const levelText = document.getElementById('header-level');
        const xpText = document.getElementById('header-xp');
        const levelDisplay = document.getElementById('level-text');
        
        if (levelText) levelText.textContent = `Seviye ${this.user.level}`;
        if (xpText) xpText.textContent = `${this.user.xp} XP`;
        if (levelDisplay) levelDisplay.textContent = `Seviye ${this.user.level} - ${this.getLevelTitle()}`;
    }

    getLevelTitle() {
        const titles = ['Çaylak', 'Amatör', 'Yetenekli', 'Profesyonel', 'Yıldız', 'Efsane'];
        return titles[Math.min(this.user.level - 1, titles.length - 1)];
    }

    addXP(amount) {
        this.user.xp += amount;
        const xpForNext = this.user.level * 500;

        if (this.user.xp >= xpForNext) {
            this.levelUp();
        }
        this.saveUser();
    }

    levelUp() {
        this.user.level++;
        this.user.xp = 0;
        this.notify(`Tebrikler! Seviye ${this.user.level} oldunuz!`);
    }

    addWin(gameType) {
        this.user.stats.totalGames++;
        this.user.stats.wins++;
        this.user.stats.currentStreak++;
        if (this.user.stats.currentStreak > this.user.stats.bestStreak) {
            this.user.stats.bestStreak = this.user.stats.currentStreak;
        }
        this.saveUser();
    }

    addLoss() {
        this.user.stats.totalGames++;
        this.user.stats.currentStreak = 0;
        this.saveUser();
    }

    notify(message) {
        // Simple fallback notification
        const toast = document.getElementById('level-up-toast');
        const msg = document.getElementById('level-up-message');
        if (toast && msg) {
            msg.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        } else {
            alert(message);
        }
    }
}