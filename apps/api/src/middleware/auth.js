const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET is not set — authentication will fail at runtime');
}

/**
 * Express middleware that verifies a JWT from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 * Returns 401 if the token is missing or invalid.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Missing authorization token',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ err: err.message }, 'JWT verification failed');
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Generate a signed JWT for a user.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, generateToken };
