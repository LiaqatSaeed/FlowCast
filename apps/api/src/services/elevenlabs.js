const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const logger = require('../lib/logger');

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Generate a voiceover MP3 from text using ElevenLabs and stream it to disk.
 *
 * @param {string} scriptText - The spoken script text to synthesise.
 * @param {string} outputPath - Absolute path where the .mp3 should be written.
 * @returns {Promise<{ filePath: string, duration: number }>}
 *   filePath is the written output path; duration is estimated from word count.
 */
async function generateVoiceover(scriptText, outputPath) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!voiceId || !apiKey) {
    throw new Error('Missing ELEVENLABS_VOICE_ID or ELEVENLABS_API_KEY environment variables');
  }

  const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`;

  logger.info({ voiceId, chars: scriptText.length }, 'Requesting ElevenLabs voiceover');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: scriptText,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Stream the audio to disk
  await new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(outputPath);
    response.body.pipe(dest);
    response.body.on('error', reject);
    dest.on('finish', resolve);
    dest.on('error', reject);
  });

  // Estimate duration: average English speech ~150 words/min = 2.5 words/sec
  const wordCount = scriptText.trim().split(/\s+/).length;
  const duration = Math.ceil(wordCount / 2.5);

  logger.info({ filePath: outputPath, duration }, 'Voiceover written');
  return { filePath: outputPath, duration };
}

module.exports = { generateVoiceover };
