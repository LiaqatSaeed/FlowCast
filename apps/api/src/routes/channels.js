const router = require('express').Router();
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');

/**
 * GET /api/channels
 * List all channels with their most recent analytics row.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data: channels, error } = await supabase
      .from('channels')
      .select(`
        *,
        analytics (
          date, views, new_subscribers, watch_time_seconds, revenue, avg_ctr
        )
      `)
      .order('created_at', { ascending: false })
      .order('date', { ascending: false, foreignTable: 'analytics' });

    if (error) throw error;

    // Attach only the latest analytics row to each channel
    const result = channels.map((ch) => ({
      ...ch,
      latest_analytics: ch.analytics?.[0] ?? null,
      analytics: undefined,
    }));

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/channels/:id
 * Single channel with full video list.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (chErr) throw chErr;
    if (!channel) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    const { data: videos, error: vErr } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', req.params.id)
      .order('created_at', { ascending: false });

    if (vErr) throw vErr;

    res.json({ success: true, data: { ...channel, videos }, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/channels
 * Create a channel from an approved opportunity.
 * Body: { opportunity_id, name, niche, prompt, platforms, posting_freq }
 */
router.post('/', async (req, res, next) => {
  try {
    const { opportunity_id, name, niche, prompt, platforms, posting_freq } = req.body;

    if (!name || !niche) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'name and niche are required',
      });
    }

    const { data, error } = await supabase
      .from('channels')
      .insert({
        opportunity_id: opportunity_id || null,
        name,
        niche,
        prompt: prompt || '',
        platforms: platforms || [],
        posting_freq: posting_freq || 1,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Mark the opportunity as approved if provided
    if (opportunity_id) {
      await supabase
        .from('opportunities')
        .update({ status: 'approved' })
        .eq('id', opportunity_id);
    }

    logger.info({ channelId: data.id, name }, 'Channel created');
    res.status(201).json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/channels/:id
 * Update channel settings or status.
 * Body: any subset of { status, prompt, platforms, posting_freq, next_upload_at }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'prompt', 'platforms', 'posting_freq', 'next_upload_at',
      'subscribers', 'total_views', 'monthly_revenue', 'health_score'];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/channels/:id
 * Archive (soft-delete) a channel by setting status to 'archived'.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .update({ status: 'archived' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    logger.info({ channelId: req.params.id }, 'Channel archived');
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
