
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mock data - KV-free
  const mockLeaderboard = [
    { name: 'FutbolSever', score: 2500, level: 5 },
    { name: 'WordleKral', score: 2100, level: 4 },
    { name: 'Tahminci', score: 1850, level: 3 },
    { name: 'GolMakinesi', score: 1200, level: 2 },
    { name: 'Anonim', score: 100, level: 1 }
  ];

  return res.status(200).json({
    success: true,
    message: 'Leaderboard hazır',
    leaderboard: mockLeaderboard
  });
}