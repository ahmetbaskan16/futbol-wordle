import { kv } from '@vercel/kv';

export default async function handler(req, res) {
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
    // ==================== GET ====================
    if (req.method === 'GET') {
      const { filter = 'global', uuid } = req.query;

      // GLOBAL SIRALAMASI
      if (filter === 'global') {
        const rawScores = await kv.zrange('leaderboard', 0, 99, { rev: true, withScores: true });
        const names = await kv.hgetall('user_names') || {};
        
        const leaderboard = [];
        for (let i = 0; i < rawScores.length; i += 2) {
          const userUuid = rawScores[i];
          const score = rawScores[i + 1];
          const userData = await kv.hgetall(`user:${userUuid}`) || {};
          
          leaderboard.push({ 
            uuid: userUuid, 
            name: names[userUuid] || 'Anonim', 
            score: score,
            achievements: userData.achievements || [],
            level: userData.level || 1
          });
        }
        return res.status(200).json(leaderboard);
      }

      // ARKADAŞ SIRALAMASI
      if (filter === 'friends' && uuid) {
        const friendsList = await kv.smembers(`friends:${uuid}`) || [];
        const names = await kv.hgetall('user_names') || {};
        
        const friendScores = [];
        for (const friendUuid of friendsList) {
          const score = await kv.zscore('leaderboard', friendUuid);
          const userData = await kv.hgetall(`user:${friendUuid}`) || {};
          
          if (score !== null) {
            friendScores.push({
              uuid: friendUuid,
              name: names[friendUuid] || 'Anonim',
              score: score,
              achievements: userData.achievements || [],
              level: userData.level || 1
            });
          }
        }
        
        friendScores.sort((a, b) => b.score - a.score);
        return res.status(200).json(friendScores);
      }

      // KENDİ İSTATİSTİKLERİ
      if (filter === 'personal' && uuid) {
        const userData = await kv.hgetall(`user:${uuid}`) || {};
        const score = await kv.zscore('leaderboard', uuid);
        
        return res.status(200).json({
          uuid: uuid,
          score: score || 0,
          achievements: userData.achievements || [],
          level: userData.level || 1,
          totalGames: userData.totalGames || 0,
          wins: userData.wins || 0,
          streak: userData.streak || 0,
          maxStreak: userData.maxStreak || 0
        });
      }
    }

    // ==================== POST ====================
    if (req.method === 'POST') {
      const { name, score, uuid, action } = req.body;

      if (!uuid) {
        return res.status(400).json({ error: 'UUID gerekli' });
      }

      // SKOR GÜNCELLE
      if (action === 'updateScore') {
        if (score === undefined || !name) {
          return res.status(400).json({ error: 'Score ve name gerekli' });
        }

        await Promise.all([
          kv.hset('user_names', { [uuid]: name.substring(0, 20) }),
          kv.zadd('leaderboard', { score: score, member: uuid })
        ]);

        return res.status(200).json({ success: true });
      }

      // ROZET EKLE
      if (action === 'addAchievement') {
        const { achievement } = req.body;
        if (!achievement) return res.status(400).json({ error: 'Achievement gerekli' });

        const userData = await kv.hgetall(`user:${uuid}`) || {};
        const achievements = userData.achievements || [];

        if (!achievements.includes(achievement)) {
          achievements.push(achievement);
          await kv.hset(`user:${uuid}`, {
            achievements: JSON.stringify(achievements),
            level: (userData.level || 1) + 1
          });
        }

        return res.status(200).json({ success: true, achievements });
      }

      // ARKADAŞ EKLE
      if (action === 'addFriend') {
        const { friendUuid } = req.body;
        if (!friendUuid) return res.status(400).json({ error: 'friendUuid gerekli' });

        await kv.sadd(`friends:${uuid}`, friendUuid);
        await kv.sadd(`friends:${friendUuid}`, uuid); // İki yönlü

        return res.status(200).json({ success: true });
      }

      // ARKADAŞ ÇIKAR
      if (action === 'removeFriend') {
        const { friendUuid } = req.body;
        if (!friendUuid) return res.status(400).json({ error: 'friendUuid gerekli' });

        await kv.srem(`friends:${uuid}`, friendUuid);
        await kv.srem(`friends:${friendUuid}`, uuid);

        return res.status(200).json({ success: true });
      }
    }

    // ==================== PUT ====================
    if (req.method === 'PUT') {
      const { uuid, stats } = req.body;
      if (!uuid || !stats) {
        return res.status(400).json({ error: 'UUID ve stats gerekli' });
      }

      await kv.hset(`user:${uuid}`, {
        totalGames: stats.played || 0,
        wins: stats.wins || 0,
        streak: stats.streak || 0,
        maxStreak: stats.maxStreak || 0,
        updatedAt: Date.now()
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: 'Veritabanı hatası' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
