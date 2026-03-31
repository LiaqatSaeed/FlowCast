const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../lib/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5';

/**
 * Parse and validate a JSON array from a Claude response string.
 * Claude sometimes wraps JSON in markdown code fences — strip those first.
 * @param {string} text
 * @returns {Array}
 */
function extractJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array from Claude');
  return parsed;
}

/**
 * Score an array of trending topics and return the top channel opportunities.
 *
 * @param {Array<{topic: string, searchVolume: number}>} trendsArray
 * @returns {Promise<Array<{
 *   name: string, niche: string, score: number, trend_pct: number,
 *   competition: string, cpm_range: string, why: string, format: string,
 *   platforms: string[], drafts: string[]
 * }>>}
 */
async function scoreTrends(trendsArray) {
  const trendsText = trendsArray
    .map((t) => `- ${t.topic} (search volume: ${t.searchVolume})`)
    .join('\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You are a senior YouTube content strategist with deep knowledge of faceless channel monetization,
CPM rates by niche, and viral content formats. Your analysis is data-driven and concise.`,
    messages: [
      {
        role: 'user',
        content: `Analyze these trending topics and identify the top 5 best opportunities to launch
profitable faceless YouTube/TikTok/Instagram Reels channels.

Trending topics:
${trendsText}

Return a JSON array (no markdown, no explanation) with exactly 5 objects, each with these fields:
- name: catchy channel brand name (one or two words, no spaces, PascalCase)
- niche: specific niche description (e.g. "Quiet Luxury Lifestyle")
- score: opportunity score 0-100 (higher = better)
- trend_pct: estimated trend growth percentage (integer)
- competition: "Low", "Medium", or "High"
- cpm_range: estimated CPM range e.g. "$8–14"
- why: one sentence explaining why this niche is profitable right now
- format: video format description e.g. "60s voiceover + b-roll montage"
- platforms: array of platform codes from ["YT","IG","TT"]
- drafts: array of 5 scroll-stopping video title ideas for this channel

Sort by score descending.`,
      },
    ],
  });

  const text = message.content.map((b) => b.text || '').join('');
  logger.info({ model: MODEL, tokens: message.usage }, 'scoreTrends complete');

  const opportunities = extractJsonArray(text);

  // Validate required fields
  const required = ['name', 'niche', 'score', 'trend_pct', 'competition', 'cpm_range', 'why', 'format', 'platforms', 'drafts'];
  for (const opp of opportunities) {
    for (const field of required) {
      if (opp[field] === undefined || opp[field] === null) {
        throw new Error(`Claude response missing field "${field}" in opportunity: ${opp.name}`);
      }
    }
  }

  return opportunities;
}

/**
 * Generate a full short-form video script for a channel and trending topic.
 *
 * @param {{ name: string, niche: string, prompt: string }} channel
 * @param {string} trendingTopic
 * @returns {Promise<{
 *   title: string, hook: string, body: string,
 *   onScreenText: string[], cta: string, hashtags: string[],
 *   thumbnailConcept: string, estimatedDuration: number
 * }>}
 */
async function generateScript(channel, trendingTopic) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You are an expert short-form video scriptwriter specialising in faceless YouTube Shorts,
Instagram Reels, and TikTok. Every script you write gets millions of views.
Your hooks stop the scroll in under 3 seconds. Your scripts are tight, punchy, and platform-native.`,
    messages: [
      {
        role: 'user',
        content: `Write a complete video script for this channel:

Channel name: ${channel.name}
Niche: ${channel.niche}
Channel brief: ${channel.prompt || channel.niche}
Today's trending topic: ${trendingTopic}

Requirements:
- Script should be 60–90 seconds when read aloud at a natural pace
- The first sentence (hook) must stop the scroll — make it a bold claim, shocking stat, or curiosity gap
- Body should deliver real value in tight, energetic sentences
- CTA must be a natural call to follow/subscribe

Return a JSON object (no markdown, no explanation) with these exact fields:
- title: YouTube-optimised video title (max 60 chars, hook-first)
- hook: first sentence only — the 3-second scroll-stopper
- body: the main script body (spoken words, no stage directions)
- onScreenText: array of 3-4 short caption overlays to show on screen
- cta: the final 5-second call to action (spoken)
- hashtags: array of 8-10 relevant hashtags without the # symbol
- thumbnailConcept: one sentence describing the thumbnail visual
- estimatedDuration: estimated spoken duration in seconds (integer)`,
      },
    ],
  });

  const text = message.content.map((b) => b.text || '').join('');
  logger.info({ model: MODEL, tokens: message.usage, channel: channel.name }, 'generateScript complete');

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const script = JSON.parse(raw);

  const required = ['title', 'hook', 'body', 'onScreenText', 'cta', 'hashtags', 'thumbnailConcept', 'estimatedDuration'];
  for (const field of required) {
    if (script[field] === undefined || script[field] === null) {
      throw new Error(`Claude script response missing field: ${field}`);
    }
  }

  return script;
}

module.exports = { scoreTrends, generateScript };
