const router = require('express').Router();
const supabase = require('../lib/supabase');
const { generateScript } = require('../services/claude');
const logger = require('../lib/logger');

/**
 * GET /api/queue
 * All upcoming (non-published) scheduled videos ordered by created_at.
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        channels ( id, name, niche, platforms )
      `)
      .not('status', 'eq', 'published')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/queue/:channelId
 * Queue for a specific channel.
 */
router.get('/:channelId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', req.params.channelId)
      .not('status', 'eq', 'published')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/queue/generate
 * Manually trigger script generation for a channel.
 * Body: { channel_id, topic? }
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { channel_id, topic } = req.body;

    if (!channel_id) {
      return res.status(400).json({ success: false, data: null, error: 'channel_id is required' });
    }

    // Fetch channel
    const { data: channel, error: chErr } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .single();

    if (chErr) throw chErr;
    if (!channel) return res.status(404).json({ success: false, data: null, error: 'Channel not found' });
    if (channel.status !== 'active') {
      return res.status(400).json({ success: false, data: null, error: 'Channel is not active' });
    }

    const trendingTopic = topic || channel.niche;
    logger.info({ channelId: channel_id, topic: trendingTopic }, 'Generating script');

    const script = await generateScript(channel, trendingTopic);

    // Insert video record with generated script
    const { data: video, error: vErr } = await supabase
      .from('videos')
      .insert({
        channel_id,
        title: script.title,
        script: [
          script.hook,
          script.body,
          script.cta,
        ].join('\n\n'),
        hashtags: script.hashtags || [],
        status: 'scripted',
      })
      .select()
      .single();

    if (vErr) throw vErr;

    logger.info({ videoId: video.id, title: video.title }, 'Script generated');
    res.status(201).json({ success: true, data: { video, scriptDetail: script }, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
