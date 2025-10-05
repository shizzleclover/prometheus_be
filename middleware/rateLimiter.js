const rateLimit = require('express-rate-limit');

// 20 messages per minute
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { chatRateLimiter };

