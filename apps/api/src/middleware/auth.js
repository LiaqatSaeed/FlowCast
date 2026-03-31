const { createClient } = require('@supabase/supabase-js');
const logger = require('../lib/logger');

// Lightweight client used only to verify JWTs (no service key needed)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Express middleware that verifies a Supabase JWT from the Authorization header.
 * Attaches the decoded user to req.user on success.
 * Returns 401 if the token is missing or invalid.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, data: null, error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    logger.error({ err }, 'Auth middleware error');
    res.status(401).json({ success: false, data: null, error: 'Authentication failed' });
  }
}

module.exports = { requireAuth };
