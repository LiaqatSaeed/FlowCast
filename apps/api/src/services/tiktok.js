const fs = require('fs');
const fetch = require('node-fetch');
const logger = require('../lib/logger');

const TIKTOK_BASE = 'https://open.tiktokapis.com/v2';

/**
 * Upload a video to TikTok using the Content Posting API (file upload flow).
 *
 * Flow:
 *   1. Initialize upload — get upload_url and publish_id
 *   2. Upload the video binary in a single chunk
 *   3. Poll publish_id until status is PUBLISH_COMPLETE
 *
 * @param {object} opts
 * @param {string} opts.videoPath  - Local path to the MP4 file
 * @param {string} opts.title      - Post title / caption (max 2200 chars)
 * @param {string[]} opts.hashtags - Hashtag strings without the # symbol
 * @returns {Promise<{ publishId: string, shareUrl: string }>}
 */
async function uploadVideo({ videoPath, title, hashtags }) {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error('Missing TIKTOK_ACCESS_TOKEN environment variable');
  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found: ${videoPath}`);

  const fileSize = fs.statSync(videoPath).size;
  const caption = buildCaption(title, hashtags);

  logger.info({ title, fileSize }, 'Initializing TikTok upload');

  // Step 1: Initialize the upload
  const initRes = await fetch(`${TIKTOK_BASE}/post/publish/video/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 2200),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 3000,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();
  if (!initRes.ok || initData.error?.code !== 'ok') {
    throw new Error(`TikTok upload init failed: ${initData.error?.message || JSON.stringify(initData)}`);
  }

  const { publish_id, upload_url } = initData.data;
  logger.info({ publish_id }, 'TikTok upload initialized');

  // Step 2: Upload the video binary
  const videoBuffer = fs.readFileSync(videoPath);

  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      'Content-Length': String(fileSize),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`TikTok video binary upload failed ${uploadRes.status}: ${err}`);
  }

  logger.info({ publish_id }, 'TikTok video uploaded — polling for publish status');

  // Step 3: Poll until PUBLISH_COMPLETE
  const shareUrl = await pollPublishStatus(publish_id, token);

  return { publishId: publish_id, shareUrl };
}

/**
 * Poll TikTok publish status until complete or failed.
 * @param {string} publishId
 * @param {string} token
 * @returns {Promise<string>} share URL
 */
async function pollPublishStatus(publishId, token, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 6_000)); // 6s between polls

    const res = await fetch(`${TIKTOK_BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    const data = await res.json();
    const status = data.data?.status;
    logger.info({ publishId, status, attempt }, 'TikTok publish status');

    if (status === 'PUBLISH_COMPLETE') {
      return data.data?.publicaly_available_post_id
        ? `https://www.tiktok.com/@me/video/${data.data.publicaly_available_post_id}`
        : 'https://www.tiktok.com';
    }

    if (status === 'FAILED') {
      throw new Error(`TikTok publish failed: ${data.data?.fail_reason || 'Unknown reason'}`);
    }
  }

  throw new Error('TikTok publish timed out after 2 minutes');
}

/**
 * Refresh a TikTok access token using a refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number }>}
 */
async function refreshAccessToken(refreshToken) {
  const res = await fetch(`${TIKTOK_BASE}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '',
      client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`TikTok token refresh failed: ${data.error || JSON.stringify(data)}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Build a TikTok caption from title + hashtags.
 * @param {string} title
 * @param {string[]} hashtags
 * @returns {string}
 */
function buildCaption(title, hashtags) {
  const tags = (hashtags || []).map((h) => `#${h}`).join(' ');
  return tags ? `${title}\n\n${tags}` : title;
}

module.exports = { uploadVideo, refreshAccessToken };
