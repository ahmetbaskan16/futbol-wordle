import { kv } from '@vercel/kv';

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
      
      // Fetch names from names hash
      const names = await kv.hgetall('user_names') || {};
      
      for (let i = 0; i < rawScores.length; i += 2) {
        const uuid = rawScores[i];
        const score = rawScores[i + 1];
        leaderboard.push({ 
          uuid: uuid, 
          name: names[uuid] || 'Anonim', 
          score: score 
        });
      }
      return res.status(200).json(leaderboard);
    }

    if (req.method === 'POST') {
      const { name, score, uuid } = req.body;
      if (!name || score === undefined || !uuid) {
        return res.status(400).json({ error: 'Missing name, score or uuid' });
      }
      
      // Update name hash and score list
      await Promise.all([
        kv.hset('user_names', { [uuid]: name.substring(0, 20) }),
        kv.zadd('leaderboard', { score: score, member: uuid })
      ]);
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await Promise.all([
        kv.del('leaderboard'),
        kv.del('user_names')
      ]);
      return res.status(200).json({ success: true, message: 'Leaderboard wiped' });
    }

  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: 'Database Connection Error. Check Vercel KV setup.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
