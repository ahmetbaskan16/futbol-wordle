/**
 * Futbol Wordle - Mission Tracker
 */

const missionsData = [
    { id: 'win_1_wordle', title: 'İlk Zafer', desc: 'Kulüp Wordle modunda 1 galibiyet al', goal: 1, xp: 100, icon: '🏆' },
    { id: 'play_3_games', title: 'Oyun Tutkunu', desc: 'Herhangi bir modda 3 oyun oyna', goal: 3, xp: 50, icon: '🎮' },
    { id: 'streak_5_higher', title: 'Analist', desc: 'Alt-Üst modunda 5 seri yap', goal: 5, xp: 150, icon: '📊' },
    { id: 'score_20_logo', title: 'Logo Uzmanı', desc: 'Logo Quiz modunda 20 skora ulaş', goal: 20, xp: 200, icon: '🎨' }
];

function checkDailyReset() {
    const user = JSON.parse(localStorage.getItem('fw_user_data'));
    if (!user) return;

    const today = new Date().toDateString();
    if (user.lastMissionReset !== today) {
        user.missionProgress = {};
        user.lastMissionReset = today;
        localStorage.setItem('fw_user_data', JSON.stringify(user));
    }
}

function initMissions() {
    checkDailyReset();
    const container = document.getElementById('daily-missions-container');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('fw_user_data')) || {};
    const progress = user.missionProgress || {};

    container.innerHTML = '';
    missionsData.forEach(mission => {
        const currentProgress = progress[mission.id] || 0;
        const percent = Math.min((currentProgress / mission.goal) * 100, 100);
        const isCompleted = currentProgress >= mission.goal;

        const card = document.createElement('div');
        card.className = `mission-card ${isCompleted ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="mission-icon">${mission.icon}</div>
            <div class="mission-content">
                <div class="mission-title">${mission.title}</div>
                <div class="mission-desc">${mission.desc}</div>
                <div class="mission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="mission-reward">${mission.xp} XP</div>
                </div>
            </div>
            ${isCompleted ? '<div class="mission-status">✅</div>' : ''}
        `;
        container.appendChild(card);
    });
}

function updateMissionProgress(id, increment = 1, setDirectly = false) {
    checkDailyReset();
    const user = JSON.parse(localStorage.getItem('fw_user_data'));
    if (!user) return;
    if (!user.missionProgress) user.missionProgress = {};
    
    const mission = missionsData.find(m => m.id === id);
    if (!mission) return;

    const oldProgress = user.missionProgress[id] || 0;
    if (setDirectly) {
        user.missionProgress[id] = Math.max(oldProgress, increment);
    } else {
        user.missionProgress[id] = (user.missionProgress[id] || 0) + increment;
    }
    
    const newProgress = user.missionProgress[id];
    
    // Reward XP if just completed
    if (oldProgress < mission.goal && newProgress >= mission.goal) {
        if (window.app) {
            window.app.addXP(mission.xp);
            window.app.notify(`Görev Tamamlandı: ${mission.title}! +${mission.xp} XP`);
        }
    }
    
    localStorage.setItem('fw_user_data', JSON.stringify(user));
    initMissions();
}

document.addEventListener('DOMContentLoaded', initMissions);
