// backend/src/middleware/rateLimiter.js (exemple sûr)
const { rateLimit } = require('express-rate-limit');

let RedisStore, buildStore;
try {
  ({ RedisStore } = require('rate-limit-redis'));
  const Redis = require('ioredis');
  buildStore = () => {
    if (!process.env.REDIS_URL) return undefined; // fallback mémoire
    const client = new Redis(process.env.REDIS_URL);
    return new RedisStore({
      // API doc ioredis: utiliser client.call(command, ...args)
      sendCommand: (command, ...args) => client.call(command, ...args),
    });
  };
} catch {
  buildStore = () => undefined; // module absent -> mémoire
}

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore && buildStore(),
});
