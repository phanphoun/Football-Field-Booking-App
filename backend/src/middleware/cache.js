const cacheStore = new Map();

const cleanupExpired = () => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
};

const buildKey = (req) => {
  const userPart = req.user?.id ? `user:${req.user.id}` : 'guest';
  return `${req.method}:${req.originalUrl}:${userPart}`;
};

const responseCache = (ttlSeconds = 60) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  cleanupExpired();

  const key = buildKey(req);
  const cached = cacheStore.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.payload);
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheStore.set(key, {
        payload,
        expiresAt: Date.now() + ttlSeconds * 1000
      });
    }
    return originalJson(payload);
  };

  return next();
};

const clearCache = () => {
  cacheStore.clear();
};

module.exports = {
  responseCache,
  clearCache
};
