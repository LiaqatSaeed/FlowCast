const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('../lib/logger');

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const MAX_DURATION = 60;
const MUSIC_DIR = path.join(__dirname, '../../assets/music');

/**
 * Get the duration of a media file in seconds using ffprobe.
 * @param {string} filePath
 * @returns {Promise<number>}
 */
function getMediaDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Concatenate footage clips to meet a target duration.
 * Clips are looped if there are not enough to fill the duration.
 * @param {string[]} footagePaths
 * @param {number} targetDuration - seconds
 * @param {string} outputPath
 * @returns {Promise<string>} - outputPath
 */
async function concatFootage(footagePaths, targetDuration, outputPath) {
  const concatListPath = path.join(os.tmpdir(), `flowcast_concat_${Date.now()}.txt`);
  const lines = [];
  let accumulated = 0;
  let i = 0;

  while (accumulated < targetDuration) {
    const clipPath = footagePaths[i % footagePaths.length];
    const clipDur = await getMediaDuration(clipPath);
    lines.push(`file '${clipPath}'`);
    accumulated += clipDur;
    i++;
    if (i > footagePaths.length * 10) break; // safety guard against infinite loop
  }

  fs.writeFileSync(concatListPath, lines.join('\n'));

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .videoFilters([
        // Scale and crop to 9:16, centred
        `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase`,
        `crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}`,
      ])
      .outputOptions(['-t', String(targetDuration), '-an'])
      .output(outputPath)
      .on('end', () => {
        fs.unlinkSync(concatListPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        try { fs.unlinkSync(concatListPath); } catch (_) {}
        reject(err);
      })
      .run();
  });
}

/**
 * Pick a random background music file from assets/music/, or null if none found.
 * @returns {string|null}
 */
function pickMusicFile() {
  if (!fs.existsSync(MUSIC_DIR)) return null;
  const files = fs.readdirSync(MUSIC_DIR).filter((f) => /\.(mp3|wav|aac|m4a)$/i.test(f));
  if (files.length === 0) return null;
  return path.join(MUSIC_DIR, files[Math.floor(Math.random() * files.length)]);
}

/**
 * Build a complete 9:16 vertical video from footage clips, voiceover, and captions.
 *
 * @param {object} opts
 * @param {string[]} opts.footagePaths      - Local paths to footage MP4 clips.
 * @param {string}   opts.voiceoverPath     - Local path to voiceover .mp3.
 * @param {string}   [opts.srtPath]         - Local path to .srt subtitle file (optional).
 * @param {string}   opts.outputPath        - Where to write the final MP4.
 * @param {string}   opts.channelName       - Channel name for thumbnail overlay.
 * @returns {Promise<{ videoPath: string, thumbnailPath: string }>}
 */
async function buildVideo({ footagePaths, voiceoverPath, srtPath, outputPath, channelName }) {
  if (!footagePaths || footagePaths.length === 0) throw new Error('footagePaths cannot be empty');
  if (!fs.existsSync(voiceoverPath)) throw new Error(`Voiceover not found: ${voiceoverPath}`);

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const voiceDuration = Math.min(await getMediaDuration(voiceoverPath), MAX_DURATION);
  logger.info({ voiceDuration, clips: footagePaths.length }, 'Building video');

  const tmpDir = path.join(os.tmpdir(), 'flowcast', `build_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Step 1: Concatenate footage to match voiceover duration
  const rawVideoPath = path.join(tmpDir, 'raw_video.mp4');
  await concatFootage(footagePaths, voiceDuration, rawVideoPath);

  // Step 2: Assemble final video — overlay voiceover + optional music + optional captions
  const musicFile = pickMusicFile();
  const thumbnailPath = outputPath.replace(/\.mp4$/i, '_thumb.jpg');

  await new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    // Input 0: raw video (no audio)
    cmd.input(rawVideoPath);
    // Input 1: voiceover
    cmd.input(voiceoverPath);

    const filterParts = [];
    let audioMix = '[1:a]volume=1.0[voiceover]';
    let finalAudio = '[voiceover]';

    if (musicFile) {
      // Input 2: background music
      cmd.input(musicFile);
      filterParts.push(audioMix);
      filterParts.push(`[2:a]volume=0.08[music]`); // -20 dB ≈ 0.1 amplitude
      filterParts.push(`[voiceover][music]amix=inputs=2:duration=first[audio_out]`);
      finalAudio = '[audio_out]';
    }

    // Subtitle/caption filter
    let videoFilter = `[0:v]scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}[vscaled]`;
    let finalVideo = '[vscaled]';

    if (srtPath && fs.existsSync(srtPath)) {
      const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      filterParts.push(videoFilter);
      filterParts.push(
        `[vscaled]subtitles='${escapedSrt}':force_style='FontName=Arial,FontSize=16,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=60'[vfinal]`
      );
      finalVideo = '[vfinal]';
    } else {
      filterParts.push(videoFilter);
      finalVideo = '[vscaled]';
    }

    const filterComplex = filterParts.join(';');

    if (filterComplex) cmd.complexFilter(filterComplex);

    cmd
      .map(finalVideo)
      .map(finalAudio || '1:a')
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset', 'fast',
        '-crf', '23',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-t', String(voiceDuration),
        '-shortest',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Step 3: Generate thumbnail — extract frame at 3s, overlay channel name
  await new Promise((resolve, reject) => {
    ffmpeg(outputPath)
      .seekInput(3)
      .frames(1)
      .videoFilters([
        `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase`,
        `crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}`,
        `drawtext=text='${channelName.replace(/'/g, "\\'")}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black:shadowx=3:shadowy=3`,
      ])
      .output(thumbnailPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Clean up temp build directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  logger.info({ videoPath: outputPath, thumbnailPath }, 'Video build complete');
  return { videoPath: outputPath, thumbnailPath };
}

module.exports = { buildVideo };
