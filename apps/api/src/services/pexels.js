const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const logger = require('../lib/logger');

const PEXELS_BASE = 'https://api.pexels.com';
const TMP_DIR = path.join(require('os').tmpdir(), 'flowcast', 'footage');

/**
 * Search Pexels for vertical portrait videos matching the given keywords,
 * download the best results to a temp directory, and return their local paths.
 *
 * @param {string[]} keywords - Search terms (joined into a query string).
 * @param {number} count - Number of videos to download (default 6).
 * @returns {Promise<string[]>} Array of absolute local file paths.
 */
async function fetchFootage(keywords, count = 6) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('Missing PEXELS_API_KEY environment variable');

  const query = keywords.join(' ');
  const url = new URL(`${PEXELS_BASE}/videos/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'portrait');
  url.searchParams.set('min_duration', '5');
  url.searchParams.set('max_duration', '20');
  url.searchParams.set('per_page', String(Math.min(count * 2, 40))); // fetch extra, filter down
  url.searchParams.set('size', 'medium');

  logger.info({ query, count }, 'Searching Pexels footage');

  const searchRes = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Pexels search error ${searchRes.status}: ${errText}`);
  }

  const { videos } = await searchRes.json();

  if (!videos || videos.length === 0) {
    throw new Error(`No Pexels footage found for keywords: ${keywords.join(', ')}`);
  }

  // Pick the SD or HD file closest to portrait 9:16
  const selected = videos
    .slice(0, count)
    .map((v) => {
      const file =
        v.video_files.find((f) => f.quality === 'sd' && f.width < f.height) ||
        v.video_files.find((f) => f.width < f.height) ||
        v.video_files[0];
      return { id: v.id, link: file.link };
    })
    .filter((v) => v.link);

  // Ensure temp directory exists
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  const filePaths = await Promise.all(
    selected.map(async ({ id, link }) => {
      const filePath = path.join(TMP_DIR, `${id}.mp4`);

      // Skip download if already cached in this run
      if (fs.existsSync(filePath)) return filePath;

      logger.info({ id, link }, 'Downloading footage');

      const res = await fetch(link);
      if (!res.ok) throw new Error(`Failed to download footage ${id}: ${res.status}`);

      await new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(filePath);
        res.body.pipe(dest);
        res.body.on('error', reject);
        dest.on('finish', resolve);
        dest.on('error', reject);
      });

      return filePath;
    })
  );

  logger.info({ count: filePaths.length }, 'Footage download complete');
  return filePaths;
}

module.exports = { fetchFootage };
