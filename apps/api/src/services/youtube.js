const fs = require('fs');
const fetch = require('node-fetch');
const logger = require('../lib/logger');

const YT_API_BASE = 'https://www.googleapis.com';

/**
 * Exchange an OAuth2 authorization code for access + refresh tokens.
 * Use this once during initial setup to get your refresh token.
 *
 * @param {string} code - Authorization code from OAuth2 redirect
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number }>}
 */
async function exchangeCode(code) {
  const res = await fetch(`${YT_API_BASE}/oauth2/v4/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`YouTube token exchange failed: ${JSON.stringify(data)}`);
  return data;
}

/**
 * Get a fresh access token using the stored refresh token.
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('Missing YOUTUBE_REFRESH_TOKEN environment variable');

  const res = await fetch(`${YT_API_BASE}/oauth2/v4/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`YouTube token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

/**
 * Upload a video to YouTube using the resumable upload protocol.
 *
 * @param {object} opts
 * @param {string} opts.videoPath     - Local path to the MP4 file
 * @param {string} opts.title         - Video title (max 100 chars)
 * @param {string} opts.description   - Video description
 * @param {string[]} opts.tags        - Array of tag strings
 * @param {string} [opts.thumbnailPath] - Local path to thumbnail image (optional)
 * @returns {Promise<{ videoId: string, url: string }>}
 */
async function uploadVideo({ videoPath, title, description, tags, thumbnailPath }) {
  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found: ${videoPath}`);

  const accessToken = await getAccessToken();
  const fileSize = fs.statSync(videoPath).size;

  logger.info({ title, fileSize }, 'Starting YouTube upload');

  // Step 1: Initiate resumable upload session
  const initRes = await fetch(
    `${YT_API_BASE}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(fileSize),
      },
      body: JSON.stringify({
        snippet: {
          title: title.substring(0, 100),
          description,
          tags: tags || [],
          categoryId: '22', // People & Blogs
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`YouTube upload initiation failed ${initRes.status}: ${err}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube did not return an upload URL');

  // Step 2: Upload the file
  const videoBuffer = fs.readFileSync(videoPath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(fileSize),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube video upload failed ${uploadRes.status}: ${err}`);
  }

  const data = await uploadRes.json();
  const videoId = data.id;
  if (!videoId) throw new Error('YouTube did not return a video ID');

  logger.info({ videoId }, 'YouTube upload complete');

  // Step 3: Upload thumbnail if provided
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    await uploadThumbnail(videoId, thumbnailPath, accessToken);
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Set a custom thumbnail for an uploaded video.
 * @param {string} videoId
 * @param {string} thumbnailPath
 * @param {string} accessToken
 */
async function uploadThumbnail(videoId, thumbnailPath, accessToken) {
  const thumbBuffer = fs.readFileSync(thumbnailPath);
  const ext = thumbnailPath.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const res = await fetch(
    `${YT_API_BASE}/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
        'Content-Length': String(thumbBuffer.length),
      },
      body: thumbBuffer,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    logger.warn({ videoId, err }, 'Thumbnail upload failed (non-fatal)');
  } else {
    logger.info({ videoId }, 'YouTube thumbnail uploaded');
  }
}

/**
 * Fetch basic channel analytics for yesterday.
 * Requires the YouTube Analytics API scope.
 *
 * @param {string} channelId - YouTube channel ID (starts with UC...)
 * @returns {Promise<{ views: number, watchTimeMinutes: number, subscribers: number, revenue: number }>}
 */
async function getChannelAnalytics(channelId) {
  const accessToken = await getAccessToken();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
  url.searchParams.set('ids', `channel==${channelId}`);
  url.searchParams.set('startDate', dateStr);
  url.searchParams.set('endDate', dateStr);
  url.searchParams.set('metrics', 'views,estimatedMinutesWatched,subscribersGained,estimatedRevenue');
  url.searchParams.set('dimensions', 'day');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube Analytics API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const row = data.rows?.[0];

  return {
    views: row ? row[1] : 0,
    watchTimeMinutes: row ? row[2] : 0,
    subscribers: row ? row[3] : 0,
    revenue: row ? row[4] : 0,
  };
}

module.exports = { uploadVideo, getAccessToken, exchangeCode, getChannelAnalytics };
