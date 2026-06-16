import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mock data - KV olmadan çalışır
  return res.status(200).json({
    success: true,
    message: 'Leaderboard hazır',
    leaderboard: [
      { name: 'Anonim', score: 0, level: 1 }
    ]
  });
}