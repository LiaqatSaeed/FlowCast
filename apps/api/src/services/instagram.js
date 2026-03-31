const fetch = require('node-fetch');
const logger = require('../lib/logger');

const GRAPH_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Get the Instagram Business Account ID linked to the Meta access token.
 * @returns {Promise<string>} Instagram account ID
 */
async function getInstagramAccountId() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('Missing META_ACCESS_TOKEN environment variable');

  const res = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=instagram_business_account&access_token=${token}`
  );
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(`Meta API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  const page = data.data?.find((p) => p.instagram_business_account);
  if (!page) throw new Error('No Instagram Business Account found linked to this Meta token');

  return page.instagram_business_account.id;
}

/**
 * Upload a video as an Instagram Reel using the two-phase container + publish flow.
 *
 * Phase 1: Create a media container (upload URL is provided by Meta)
 * Phase 2: Publish the container
 *
 * Note: The video must be publicly accessible via URL for Meta to fetch it.
 * Upload your video to Supabase Storage first and pass the public URL.
 *
 * @param {object} opts
 * @param {string} opts.videoUrl    - Public URL of the MP4 (e.g. Supabase Storage public URL)
 * @param {string} opts.caption     - Post caption including hashtags
 * @param {string} [opts.coverUrl]  - Public URL of cover/thumbnail image (optional)
 * @returns {Promise<{ mediaId: string, url: string }>}
 */
async function uploadReel({ videoUrl, caption, coverUrl }) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('Missing META_ACCESS_TOKEN environment variable');

  const accountId = await getInstagramAccountId();
  logger.info({ accountId }, 'Creating Instagram Reel container');

  // Phase 1: Create media container
  const containerParams = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: caption.substring(0, 2200), // IG caption limit
    share_to_feed: 'true',
    access_token: token,
  });

  if (coverUrl) containerParams.set('cover_url', coverUrl);

  const containerRes = await fetch(`${GRAPH_BASE}/${accountId}/media`, {
    method: 'POST',
    body: containerParams,
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(`Instagram container creation failed: ${containerData.error?.message || JSON.stringify(containerData)}`);
  }

  const containerId = containerData.id;
  logger.info({ containerId }, 'Instagram container created — waiting for processing');

  // Poll until container status is FINISHED (up to 3 minutes)
  await waitForContainer(accountId, containerId, token);

  // Phase 2: Publish the container
  const publishRes = await fetch(`${GRAPH_BASE}/${accountId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(`Instagram publish failed: ${publishData.error?.message || JSON.stringify(publishData)}`);
  }

  const mediaId = publishData.id;
  logger.info({ mediaId }, 'Instagram Reel published');

  // Fetch permalink
  const linkRes = await fetch(
    `${GRAPH_BASE}/${mediaId}?fields=permalink&access_token=${token}`
  );
  const linkData = await linkRes.json();

  return {
    mediaId,
    url: linkData.permalink || `https://www.instagram.com/p/${mediaId}/`,
  };
}

/**
 * Poll the Instagram container status until FINISHED or ERROR.
 * @param {string} accountId
 * @param {string} containerId
 * @param {string} token
 * @param {number} maxAttempts
 */
async function waitForContainer(accountId, containerId, token, maxAttempts = 18) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 10_000)); // wait 10s between polls

    const res = await fetch(
      `${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${token}`
    );
    const data = await res.json();
    const status = data.status_code;

    logger.info({ containerId, status, attempt }, 'Instagram container status');

    if (status === 'FINISHED') return;
    if (status === 'ERROR') throw new Error(`Instagram container processing failed: ${JSON.stringify(data)}`);
  }

  throw new Error('Instagram container processing timed out after 3 minutes');
}

/**
 * Get basic Instagram account insights (followers, reach) for the last day.
 * @returns {Promise<{ followers: number, reach: number, impressions: number }>}
 */
async function getAccountInsights() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('Missing META_ACCESS_TOKEN environment variable');

  const accountId = await getInstagramAccountId();

  const res = await fetch(
    `${GRAPH_BASE}/${accountId}/insights?metric=follower_count,reach,impressions&period=day&access_token=${token}`
  );
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(`Instagram insights error: ${data.error?.message || JSON.stringify(data)}`);
  }

  const byName = {};
  for (const metric of data.data || []) {
    const latest = metric.values?.[metric.values.length - 1];
    byName[metric.name] = latest?.value ?? 0;
  }

  return {
    followers: byName.follower_count || 0,
    reach: byName.reach || 0,
    impressions: byName.impressions || 0,
  };
}

module.exports = { uploadReel, getInstagramAccountId, getAccountInsights };
