import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── POST: Skor kaydet ──
  if (req.method === 'POST') {
    try {
      const { name, score, level, mode } = req.body;
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ success: false });
      }

      const member = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const entry = { name: name.trim().slice(0, 30), score, level: level || 1, mode: mode || 'club', timestamp: Date.now() };

      await redis.zadd('leaderboard', { score, member });
      await redis.hset('entry:' + member, entry);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  // ── GET: Top 50 getir ──
  if (req.method === 'GET') {
    try {
      const raw = await redis.zrevrange('leaderboard', 0, 49, { withScores: true });
      const entries = [];

      for (let i = 0; i < raw.length; i += 2) {
        const member = raw[i];
        const score = raw[i + 1];
        const data = await redis.hgetall('entry:' + member);
        if (data) {
          entries.push({
            rank: Math.floor(i / 2) + 1,
            name: data.name || 'FutbolSever',
            score: data.score || score,
            level: data.level || 1,
            mode: data.mode || 'club'
          });
        }
      }

      return res.status(200).json({ success: true, leaderboard: entries });
    } catch (err) {
      console.error(err);
      return res.status(200).json({ success: true, leaderboard: [] });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
