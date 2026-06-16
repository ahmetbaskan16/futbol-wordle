/**
 * API Mock / Handler for Daily Missions
 */

export default async function handler(req, res) {
    const dailyMissions = [
        { id: 1, title: 'Gol Krallığı', xp: 100, goal: 5 },
        { id: 2, title: 'Defans Hattı', xp: 80, goal: 3 },
        { id: 3, title: 'Yolculuk', xp: 150, goal: 10 }
    ];

    res.status(200).json(dailyMissions);
}