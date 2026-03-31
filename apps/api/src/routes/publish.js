const router = require('express').Router();
const path = require('path');
const os = require('os');
const fs = require('fs');
const supabase = require('../lib/supabase');
const { uploadVideo: uploadYouTube } = require('../services/youtube');
const { uploadReel } = require('../services/instagram');
const { uploadVideo: uploadTikTok } = require('../services/tiktok');
const { generateVoiceover } = require('../services/elevenlabs');
const { fetchFootage } = require('../services/pexels');
const { buildVideo } = require('../services/videoBuilder');
const logger = require('../lib/logger');

/**
 * POST /api/publish/:videoId
 * Full pipeline: voiceover → footage → build → upload to all platforms → mark published.
 * Called by N8N media-builder webhook or manually triggered.
 *
 * Body: { platforms?: ['YT','IG','TT'] }  — defaults to channel's platforms
 */
router.post('/:videoId', async (req, res, next) => {
  const { videoId } = req.params;
  const tmpDir = path.join(os.tmpdir(), 'flowcast', `pub_${videoId}`);

  try {
    // ── 1. Fetch video + channel ──────────────────────────────────────────────
    const { data: video, error: vErr } = await supabase
      .from('videos')
      .select('*, channels(*)')
      .eq('id', videoId)
      .single();

    if (vErr) throw vErr;
    if (!video) return res.status(404).json({ success: false, data: null, error: 'Video not found' });
    if (video.status === 'published') {
      return res.json({ success: true, data: video, error: null });
    }

    const channel = video.channels;
    const platforms = req.body.platforms || channel.platforms || ['YT'];

    logger.info({ videoId, platforms }, 'Starting publish pipeline');
    fs.mkdirSync(tmpDir, { recursive: true });

    // Mark as building
    await supabase.from('videos').update({ status: 'building' }).eq('id', videoId);

    // ── 2. Generate voiceover ─────────────────────────────────────────────────
    const voiceoverPath = path.join(tmpDir, 'voiceover.mp3');
    await generateVoiceover(video.script, voiceoverPath);

    // ── 3. Fetch footage ──────────────────────────────────────────────────────
    const keywords = [channel.niche, ...video.title.split(' ').slice(0, 3)];
    const footagePaths = await fetchFootage(keywords, 6);

    // ── 4. Build video ────────────────────────────────────────────────────────
    const outputPath = path.join(tmpDir, 'output.mp4');
    const { videoPath, thumbnailPath } = await buildVideo({
      footagePaths,
      voiceoverPath,
      outputPath,
      channelName: channel.name,
    });

    // ── 5. Upload to each platform ────────────────────────────────────────────
    const platformUrls = {};
    const caption = [
      video.title,
      '',
      (video.hashtags || []).map((h) => `#${h}`).join(' '),
    ].join('\n');

    await Promise.allSettled(
      platforms.map(async (platform) => {
        try {
          if (platform === 'YT') {
            const result = await uploadYouTube({
              videoPath,
              title: video.title,
              description: caption,
              tags: video.hashtags || [],
              thumbnailPath,
            });
            platformUrls.YT = result.url;
            logger.info({ videoId, url: result.url }, 'Published to YouTube');
          }

          if (platform === 'IG') {
            // Instagram requires a public URL — upload to Supabase Storage first
            const { data: storageData, error: storageErr } = await supabase.storage
              .from('videos')
              .upload(`${videoId}/output.mp4`, fs.readFileSync(videoPath), {
                contentType: 'video/mp4',
                upsert: true,
              });

            if (storageErr) throw storageErr;

            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(`${videoId}/output.mp4`);

            const result = await uploadReel({
              videoUrl: publicUrl,
              caption,
            });
            platformUrls.IG = result.url;
            logger.info({ videoId, url: result.url }, 'Published to Instagram');
          }

          if (platform === 'TT') {
            const result = await uploadTikTok({
              videoPath,
              title: video.title,
              hashtags: video.hashtags || [],
            });
            platformUrls.TT = result.shareUrl;
            logger.info({ videoId, url: result.shareUrl }, 'Published to TikTok');
          }
        } catch (err) {
          logger.error({ platform, videoId, err }, `Failed to publish to ${platform}`);
          platformUrls[platform] = `error: ${err.message}`;
        }
      })
    );

    // ── 6. Update video record ────────────────────────────────────────────────
    const { data: updated, error: uErr } = await supabase
      .from('videos')
      .update({
        status: 'published',
        platform_urls: platformUrls,
        published_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (uErr) throw uErr;

    // ── 7. Cleanup temp files ─────────────────────────────────────────────────
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    logger.info({ videoId, platformUrls }, 'Publish pipeline complete');
    res.json({ success: true, data: updated, error: null });

  } catch (err) {
    // Mark video as failed so it can be retried
    await supabase.from('videos').update({ status: 'failed' }).eq('id', videoId).catch(() => {});
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    next(err);
  }
});

/**
 * GET /api/publish/status/:videoId
 * Check the current publish status of a video.
 */
router.get('/status/:videoId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, status, platform_urls, published_at')
      .eq('id', req.params.videoId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
