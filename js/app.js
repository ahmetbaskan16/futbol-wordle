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
        
        const newUser = {
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
            missionProgress: {},
            achievements: []
        };
        localStorage.setItem(this.storageKey, JSON.stringify(newUser));
        return newUser;
    }

    saveUser() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.user));
        this.updateUI();
        this.syncToServer();
    }

    init() {
        this.updateUI();
    }

    updateUI() {
        const levelText = document.getElementById('header-level');
        const xpText = document.getElementById('header-xp');
        const levelDisplay = document.getElementById('level-text');
        const xpBarFill = document.getElementById('xp-bar-fill');
        const xpRemaining = document.getElementById('xp-remaining');
        
        const xpForNext = this.user.level * 500;
        const progressPercent = Math.min((this.user.xp / xpForNext) * 100, 100);

        if (levelText) levelText.textContent = `Seviye ${this.user.level}`;
        if (xpText) xpText.textContent = `${this.user.xp} XP`;
        if (levelDisplay) levelDisplay.textContent = `Seviye ${this.user.level} - ${this.getLevelTitle()}`;
        if (xpBarFill) xpBarFill.style.width = `${progressPercent}%`;
        if (xpRemaining) xpRemaining.textContent = `Sonraki seviyeye ${xpForNext - this.user.xp} XP kaldı`;
    }

    getLevelTitle() {
        const titles = ['Çaylak', 'Amatör', 'Yetenekli', 'Profesyonel', 'Yıldız', 'Efsane'];
        return titles[Math.min(this.user.level - 1, titles.length - 1)];
    }

    addXP(amount) {
        this.user.xp += amount;
        let xpForNext = this.user.level * 500;

        while (this.user.xp >= xpForNext) {
            this.levelUp();
            xpForNext = this.user.level * 500;
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
        
        // Track missions
        if (typeof updateMissionProgress === 'function') {
            updateMissionProgress('play_3_games', 1);
            if (gameType === 'wordle') updateMissionProgress('win_1_wordle', 1);
        }
        
        this.saveUser();
    }

    addLoss() {
        this.user.stats.totalGames++;
        this.user.stats.currentStreak = 0;
        
        if (typeof updateMissionProgress === 'function') {
            updateMissionProgress('play_3_games', 1);
        }
        
        this.saveUser();
    }

    async syncToServer() {
        try {
            const response = await fetch('/api/user.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userData: this.user })
            });
            const result = await response.json();
            console.log('Server sync result:', result);
        } catch (error) {
            console.error('Failed to sync with server:', error);
        }
    }

    notify(message) {
        const toast = document.getElementById('level-up-toast');
        const msg = document.getElementById('level-up-message');
        if (toast && msg) {
            msg.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        } else {
            console.log('Notification:', message);
        }
    }
}

// Global instance
window.app = new FutbolWordleApp();
