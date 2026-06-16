/**
 * Futbol Wordle - Games Logic
 * Specific handlers for different game modes
 */

class GameEngine {
    constructor() {
        this.currentScore = 0;
        this.isGameOver = false;
    }

    // Common score and XP handler
    endGame(score, type) {
        let xpGained = 0;
        switch(type) {
            case 'wordle': xpGained = score * 50; break;
            case 'higher-lower': xpGained = score * 10; break;
            case 'logo-quiz': xpGained = score * 5; break;
        }
        
        if (typeof fwApp !== 'undefined') {
            fwApp.addXP(xpGained);
        }
        
        console.log(`Game ended: ${type}, Score: ${score}, XP: ${xpGained}`);
    }
}

// Global game instance
const gameEngine = new GameEngine();