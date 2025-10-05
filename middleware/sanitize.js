function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    // Disallow MongoDB operator injection and dotted paths
    if (key.startsWith('$') || key.includes('.')) continue;
    result[key] = sanitizeValue(val);
  }
  return result;
}

// Express middleware: sanitize req.body and req.params (skip req.query for Express 5 compatibility)
function sanitizeRequest(req, _res, next) {
  if (req.body && isPlainObject(req.body)) {
    req.body = sanitizeObject(req.body);
  }
  if (req.params && isPlainObject(req.params)) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = { sanitizeRequest };


