/**
 * Premium Rate Limit Middleware
 * 10 enrichissements/heure, 3/minute
 */
const userLimits = new Map();

const premiumRateLimit = (req, res, next) => {
  const userId = req.user?._id?.toString() || 'anon';
  const now = Date.now();
  
  if (!userLimits.has(userId)) {
    userLimits.set(userId, { hourly: 0, hourlyReset: now, minute: 0, minuteReset: now });
  }
  
  const data = userLimits.get(userId);
  
  // Reset si expire
  if (now - data.hourlyReset > 3600000) { data.hourly = 0; data.hourlyReset = now; }
  if (now - data.minuteReset > 60000) { data.minute = 0; data.minuteReset = now; }
  
  // Check limites
  if (data.minute >= 3) {
    return res.status(429).json({ success: false, error: 'Trop de requetes. Attendez 1 minute.', retryAfter: 60 });
  }
  if (data.hourly >= 10) {
    return res.status(429).json({ success: false, error: 'Limite horaire atteinte (10/h).', retryAfter: 3600 });
  }
  
  data.hourly++;
  data.minute++;
  res.setHeader('X-RateLimit-Remaining', 10 - data.hourly);
  next();
};

module.exports = { premiumRateLimit };
