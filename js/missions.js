/**
 * Futbol Wordle - Mission Tracker
 */

const missionsData = [
    { id: 'win_1_wordle', title: 'Galibiyet', goal: 1, xp: 100 },
    { id: 'play_3_games', title: 'Oyun Tutkunu', goal: 3, xp: 50 },
    { id: 'streak_5_higher', title: 'Analist', goal: 5, xp: 150 }
];

function updateMissionProgress(id, increment = 1) {
    const user = JSON.parse(localStorage.getItem('fw_user_data'));
    if (!user.missionProgress) user.missionProgress = {};
    
    user.missionProgress[id] = (user.missionProgress[id] || 0) + increment;
    
    const mission = missionsData.find(m => m.id === id);
    if (user.missionProgress[id] === mission.goal) {
        if (typeof fwApp !== 'undefined') {
            fwApp.addXP(mission.xp);
        }
    }
    
    localStorage.setItem('fw_user_data', JSON.stringify(user));
}