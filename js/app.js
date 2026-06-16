/**
 * Futbol Wordle - Core App Logic
 * XP, Level, User Management
 */

const USER_KEY = 'fw_user_data';

const INITIAL_USER = {
    username: 'Misafir',
    level: 1,
    xp: 0,
    totalGames: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayed: null,
    achievements: [],
    completedMissions: []
};

class App {
    constructor() {
        this.user = this.loadUser();
        this.init();
    }

    loadUser() {
        const saved = localStorage.getItem(USER_KEY);
        if (saved) return JSON.parse(saved);
        return { ...INITIAL_USER };
    }

    saveUser() {
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
        this.updateUI();
    }

    init() {
        this.updateUI();
        this.checkDailyMissions();
        this.setupEventListeners();
    }

    updateUI() {
        const levelText = document.getElementById('header-level');
        const xpText = document.getElementById('header-xp');
        const levelDisplay = document.getElementById('level-text');
        const xpRemaining = document.getElementById('xp-remaining');
        const xpFill = document.getElementById('xp-bar-fill');
        const avatar = document.getElementById('user-avatar');

        if (levelText) levelText.textContent = `Seviye ${this.user.level}`;
        if (xpText) xpText.textContent = `${this.user.xp} XP`;
        
        const xpForNext = this.user.level * 500;
        const progress = (this.user.xp / xpForNext) * 100;

        if (levelDisplay) levelDisplay.textContent = `Seviye ${this.user.level} - ${this.getLevelTitle()}`;
        if (xpRemaining) xpRemaining.textContent = `Sonraki seviyeye ${xpForNext - this.user.xp} XP kaldı`;
        if (xpFill) xpFill.style.width = `${progress}%`;
        if (avatar) avatar.textContent = this.user.username[0].toUpperCase();
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
        this.showLevelUpNotification();
    }

    showLevelUpNotification() {
        const toast = document.getElementById('level-up-toast');
        const msg = document.getElementById('level-up-message');
        if (toast && msg) {
            msg.textContent = `Seviye ${this.user.level} oldunuz!`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    checkDailyMissions() {
        // Simple mock for now
        const container = document.getElementById('daily-missions-container');
        if (!container) return;

        const missions = [
            { id: 1, title: 'Isınma Turu', desc: 'Herhangi bir oyunda 1 maç yap', xp: 50, progress: 0, target: 1 },
            { id: 2, title: 'Bilgi Küpü', desc: 'Logo Quiz de 10 doğru yap', xp: 150, progress: 3, target: 10 },
            { id: 3, title: 'Zenginlik', desc: 'Alt-Üst oyununda 5 seri yap', xp: 200, progress: 0, target: 5 }
        ];

        container.innerHTML = missions.map(m => `
            <div class="mission-card ${m.progress >= m.target ? 'completed' : ''}">
                <div class="mission-icon">🎯</div>
                <div class="mission-content">
                    <div class="mission-title">${m.title}</div>
                    <div class="mission-desc">${m.desc}</div>
                    <div class="mission-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(m.progress / m.target) * 100}%"></div>
                        </div>
                        <div class="mission-reward">${m.xp} XP</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // User avatar click for settings (placeholder)
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.onclick = () => alert('Profil ayarları yakında!');
        }
    }
}

// Start app
const fwApp = new App();