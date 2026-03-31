const router = require('express').Router();
const supabase = require('../lib/supabase');
const { scoreTrends, generateScript } = require('../services/claude');
const logger = require('../lib/logger');

/**
 * GET /api/opportunities
 * List all opportunities ordered by score descending.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('score', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/opportunities/:id
 * Get a single opportunity by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/opportunities/:id
 * Update opportunity status (approve / skip).
 * Body: { status: 'approved' | 'skipped' }
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['pending', 'approved', 'skipped'];
    const { status } = req.body;

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: `status must be one of: ${allowed.join(', ')}`,
      });
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update({ status })
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
 * POST /api/opportunities/scan
 * Trigger a manual trend scan using Claude.
 * Body: { trends: Array<{ topic: string, searchVolume: number }> }
 */
router.post('/scan', async (req, res, next) => {
  try {
    const { trends } = req.body;

    if (!Array.isArray(trends) || trends.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Body must include a non-empty "trends" array',
      });
    }

    logger.info({ count: trends.length }, 'Starting trend scan');

    const opportunities = await scoreTrends(trends);

    // Batch-insert into Supabase
    const { data, error } = await supabase
      .from('opportunities')
      .insert(
        opportunities.map((opp) => ({
          name: opp.name,
          niche: opp.niche,
          score: opp.score,
          trend_pct: opp.trend_pct,
          competition: opp.competition,
          cpm_range: opp.cpm_range,
          why: opp.why,
          format: opp.format,
          platforms: opp.platforms,
          drafts: opp.drafts,
          status: 'pending',
        }))
      )
      .select();

    if (error) throw error;

    logger.info({ inserted: data.length }, 'Trend scan complete');
    res.status(201).json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/opportunities/:id/preview-script
 * Generate a preview script for an opportunity before launching a channel.
 * No channel_id needed — uses the opportunity's niche and why as context.
 */
router.post('/:id/preview-script', async (req, res, next) => {
  try {
    const { data: opp, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!opp) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    const fakeChannel = { name: opp.name, niche: opp.niche, prompt: opp.why };
    const script = await generateScript(fakeChannel, opp.niche);

    logger.info({ oppId: req.params.id }, 'Preview script generated');
    res.json({ success: true, data: script, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
