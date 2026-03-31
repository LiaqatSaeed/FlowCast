const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { query } = require('../lib/db');
const { generateToken } = require('../middleware/auth');
const logger = require('../lib/logger');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email and password are required',
      });
    }

    const { rows } = await query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({
        success: false, data: null, error: 'Invalid credentials',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        success: false, data: null, error: 'Invalid credentials',
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    logger.info({ userId: user.id }, 'User logged in');

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role },
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns current user from JWT
 */
router.get('/me', require('../middleware/auth').requireAuth, (req, res) => {
  res.json({ success: true, data: { user: req.user }, error: null });
});

module.exports = router;
