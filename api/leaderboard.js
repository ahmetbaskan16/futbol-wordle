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
      // Get top scores from the leaderboard
      const rawScores = await kv.zrange('leaderboard', 0, 49, { rev: true, withScores: true });
      const leaderboard = [];
      
      for (let i = 0; i < rawScores.length; i += 2) {
        const uuid = rawScores[i];
        const score = rawScores[i + 1];
        // Fetch display name from user_names hash
        const name = await kv.hget('user_names', uuid) || 'Anonymous';
        leaderboard.push({ uuid, name, score });
      }
      
      return res.status(200).json(leaderboard);
    }

    if (req.method === 'POST') {
      const { name, score, uuid } = req.body;
      if (!name || score === undefined || !uuid) {
        return res.status(400).json({ error: 'Missing name, score, or uuid' });
      }
      
      // Use UUID as the unique member in the leaderboard set
      await kv.zadd('leaderboard', { score: score, member: uuid });
      // Map UUID to display name in a hash for lookup
      await kv.hset('user_names', { [uuid]: name.substring(0, 20) });
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await kv.del('leaderboard');
      await kv.del('user_names');
      return res.status(200).json({ success: true, message: 'Database wiped' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
