import { kv } from '@vercelkv';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const rawScores = await kv.zrange('leaderboard', 0, 99, { rev: true, withScores: true });
      const leaderboard = [];
      for (let i = 0; i < rawScores.length; i += 2) {
        leaderboard.push({ name: rawScores[i], score: rawScores[i + 1] });
      }
      return res.status(200).json(leaderboard);
    }

    if (req.method === 'POST') {
      const { name, score } = req.body;
      if (!name || score === undefined) {
        return res.status(400).json({ error: 'Missing name or score' });
      }
      await kv.zadd('leaderboard', { score: score, member: name.substring(0, 20) });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Secret key or specific header to prevent accidental wipes could be added here
      await kv.del('leaderboard');
      return res.status(200).json({ success: true, message: 'Leaderboard wiped' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
