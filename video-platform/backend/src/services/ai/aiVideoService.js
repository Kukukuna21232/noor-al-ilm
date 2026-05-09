const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL })
  : null;

// ── Script Generation ─────────────────────────────────────
const generateVideoScript = async ({ topic, language = 'ar', duration = 3, style = 'educational', category = 'general' }) => {
  if (!openai) return getFallbackScript(topic, language);
  const langName = { ar: 'Arabic', ru: 'Russian', en: 'English' }[language] || 'Arabic';
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Generate a ${duration}-minute Islamic educational video script about: "${topic}"
Language: ${langName}, Style: ${style}, Category: ${category}
Return JSON: { title, intro, segments: [{heading, content, duration_seconds}], conclusion, total_duration_seconds }
Keep content authentic and aligned with mainstream Islamic scholarship.`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
    temperature: 0.7,
  });
  return JSON.parse(res.choices[0].message.content);
};

// ── Text-to-Speech ────────────────────────────────────────
const generateVoiceover = async (text, outputPath, options = {}) => {
  const { voice = 'alloy', speed = 1.0 } = options;
  if (!openai) { logger.warn('OpenAI not configured, skipping TTS'); return { path: null }; }
  const mp3 = await openai.audio.speech.create({ model: 'tts-1-hd', voice, input: text, speed });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return { path: outputPath, size: buffer.length };
};

// ── Transcription ─────────────────────────────────────────
const transcribeAudio = async (audioPath, language = 'ar') => {
  if (!openai) return { text: '', segments: [] };
  const res = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    language,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });
  return {
    text: res.text,
    language: res.language,
    duration: res.duration,
    segments: (res.segments || []).map(s => ({ id: s.id, start: s.start, end: s.end, text: s.text.trim() })),
  };
};

// ── SRT / VTT generators ──────────────────────────────────
const formatTime = (s, sep = ',') => {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, '0');
  return `${h}:${m}:${sec}${sep}${ms}`;
};

const generateSRT = (segments) =>
  segments.map((s, i) => `${i + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${s.text}\n`).join('\n');

const generateVTT = (segments) =>
  'WEBVTT\n\n' + segments.map((s, i) => `${i + 1}\n${formatTime(s.start, '.')} --> ${formatTime(s.end, '.')}\n${s.text}\n`).join('\n');

// ── Translation ───────────────────────────────────────────
const translateSubtitles = async (segments, targetLanguage, sourceLanguage = 'ar') => {
  if (!openai || !segments.length) return segments;
  const langNames = { ar: 'Arabic', ru: 'Russian', en: 'English' };
  const texts = segments.map(s => s.text);
  const batchSize = 50;
  const translated = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Translate these ${langNames[sourceLanguage]} subtitle lines to ${langNames[targetLanguage]}.
Return ONLY a JSON array of translated strings in the same order.
Lines: ${JSON.stringify(batch)}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });
    const result = JSON.parse(res.choices[0].message.content);
    const arr = Array.isArray(result) ? result : (result.translations || batch);
    translated.push(...arr);
  }
  return segments.map((s, i) => ({ ...s, text: translated[i] || s.text }));
};

// ── AI Thumbnail ──────────────────────────────────────────
const generateAIThumbnail = async (title, category, outputPath) => {
  if (!openai) return null;
  try {
    const res = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional Islamic educational video thumbnail for: "${title}". Category: ${category}. Style: Modern, elegant, Islamic geometric patterns, gold and green colors. No human faces.`,
      size: '1792x1024',
      quality: 'hd',
      n: 1,
    });
    const imgRes = await axios.get(res.data[0].url, { responseType: 'arraybuffer' });
    const sharp = require('sharp');
    await sharp(Buffer.from(imgRes.data)).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  } catch (err) {
    logger.error('AI thumbnail failed:', err.message);
    return null;
  }
};

// ── Chapters ──────────────────────────────────────────────
const generateChapters = async (transcript, duration) => {
  if (!openai || !transcript) return [];
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Analyze this transcript and generate 3-8 chapter markers.
Transcript: ${transcript.substring(0, 3000)}
Duration: ${duration}s
Return JSON: { chapters: [{timestamp_seconds, title, title_ar}] }`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });
  return JSON.parse(res.choices[0].message.content).chapters || [];
};

// ── Content moderation ────────────────────────────────────
const moderateContent = async (text) => {
  if (!openai) return { flagged: false, categories: {} };
  const res = await openai.moderations.create({ input: text });
  return { flagged: res.results[0].flagged, categories: res.results[0].categories };
};

const getFallbackScript = (topic, language) => ({
  title: topic,
  intro: language === 'ar' ? `بسم الله الرحمن الرحيم. السلام عليكم. سنتحدث اليوم عن: ${topic}` : `Во имя Аллаха. Ассаляму алейкум. Сегодня мы поговорим о: ${topic}`,
  segments: [{ heading: topic, content: language === 'ar' ? 'المحتوى التعليمي هنا...' : 'Образовательный контент здесь...', duration_seconds: 120 }],
  conclusion: language === 'ar' ? 'جزاكم الله خيراً' : 'Джазакумуллаху хайран',
  total_duration_seconds: 180,
});

module.exports = { generateVideoScript, generateVoiceover, transcribeAudio, generateSRT, generateVTT, translateSubtitles, generateAIThumbnail, generateChapters, moderateContent };
