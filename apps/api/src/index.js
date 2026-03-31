require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./lib/logger');
const { requireAuth } = require('./middleware/auth');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/channels',      requireAuth, require('./routes/channels'));
app.use('/api/opportunities', requireAuth, require('./routes/opportunities'));
app.use('/api/queue',         requireAuth, require('./routes/queue'));
app.use('/api/analytics',     requireAuth, require('./routes/analytics'));
app.use('/api/publish',       requireAuth, require('./routes/publish'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() }, error: null });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, url: req.url }, 'Unhandled error');
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info({ port: PORT }, 'FlowCast API running'));
