const { rateLimit } = require("express-rate-limit");

// Active Redis UNIQUEMENT si USE_REDIS=1 ET REDIS_URL défini ET module présent
function shouldUseRedis() {
  return process.env.USE_REDIS === "1" && !!process.env.REDIS_URL;
}

function buildRedisStoreOrUndefined() {
  if (!shouldUseRedis()) return undefined;
  let RedisStore;
  try {
    ({ RedisStore } = require("rate-limit-redis"));
  } catch {
    return undefined; // module absent -> mémoire
  }
  try {
    const Redis = require("ioredis");
    // Evite les crashs: pas de file d'attente offline, retries très bas
    const client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 500
    });
    client.on("error", (e) => console.warn("[rateLimit] Redis error:", e.message));
    // Ne force PAS la connexion ici; si Redis KO, on ne doit pas planter
    return new RedisStore({
      // ioredis v5: utiliser client.call(command, ...args)
      sendCommand: (command, ...args) => client.call(command, ...args),
    });
  } catch (e) {
    console.warn("[rateLimit] Redis disabled, fallback to memory:", e.message);
    return undefined;
  }
}

function createRateLimiter(opts = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 300,
    standardHeaders = true,
    legacyHeaders = false,
    keyPrefix = "api",
  } = opts;

  const store = buildRedisStoreOrUndefined(); // undefined => mémoire

  return rateLimit({
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    // clé simple par IP; Render met X-Forwarded-For
    keyGenerator: (req) => (req.ip || req.headers["x-forwarded-for"] || "unknown"),
    message: { success: false, error: "Too many requests" },
    store,
  });
}

// Préconfigurations prêtes à l'emploi
const apiLimiter  = createRateLimiter({ keyPrefix: "api",  windowMs: 60_000,         max: 120 });
const authLimiter = createRateLimiter({ keyPrefix: "auth", windowMs: 15 * 60 * 1000, max: 30  });

// Compat: certains fichiers attendent "rateLimiter"
module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  rateLimiter: apiLimiter,
};
