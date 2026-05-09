const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const ai = require('../services/ai/aiVideoService');
const { uploadFile, uploadBuffer } = require('../services/storage/storageService');
const logger = require('../utils/logger');

const setStatus = (jobId, status, output = {}, error = null) =>
  query('UPDATE ai_generation_jobs SET status=$1, output_data=$2, error_message=$3, updated_at=NOW() WHERE id=$4',
    [status, JSON.stringify(output), error, jobId]);

const processScriptGeneration = async (job) => {
  const { jobId, videoId, topic, language, duration, style, category } = job.data;
  try {
    await setStatus(jobId, 'processing');
    await job.progress(10);
    const script = await ai.generateVideoScript({ topic, language, duration, style, category });
    await job.progress(90);
    if (videoId) await query('UPDATE videos SET ai_script=$1 WHERE id=$2', [JSON.stringify(script), videoId]);
    await setStatus(jobId, 'completed', script);
    await job.progress(100);
    return script;
  } catch (err) {
    await setStatus(jobId, 'failed', {}, err.message);
    throw err;
  }
};

const processVoiceover = async (job) => {
  const { jobId, videoId, text, language, voice } = job.data;
  try {
    await setStatus(jobId, 'processing');
    const outPath = path.join(__dirname, '../../uploads/temp', `voice_${jobId}.mp3`);
    const result = await ai.generateVoiceover(text, outPath, { language, voice });
    await job.progress(70);
    if (result.path && fs.existsSync(result.path)) {
      const { url } = await uploadFile(result.path, `audio/${videoId}/voiceover.mp3`, 'audio/mpeg');
      if (videoId) await query('UPDATE videos SET ai_voice_id=$1 WHERE id=$2', [url, videoId]);
      fs.unlinkSync(result.path);
      await setStatus(jobId, 'completed', { audioUrl: url });
    }
    await job.progress(100);
  } catch (err) {
    await setStatus(jobId, 'failed', {}, err.message);
    throw err;
  }
};

const processSubtitles = async (job) => {
  const { jobId, videoId, audioPath, language } = job.data;
  try {
    await setStatus(jobId, 'processing');
    await job.progress(10);
    const transcript = await ai.transcribeAudio(audioPath, language);
    await job.progress(50);
    const srt = ai.generateSRT(transcript.segments);
    const vtt = ai.generateVTT(transcript.segments);
    const [srtRes, vttRes] = await Promise.all([
      uploadBuffer(Buffer.from(srt), `subtitles/${videoId}/${language}.srt`, 'text/plain'),
      uploadBuffer(Buffer.from(vtt), `subtitles/${videoId}/${language}.vtt`, 'text/vtt'),
    ]);
    await job.progress(80);
    const labels = { ar: 'العربية', ru: 'Русский', en: 'English' };
    await query(`INSERT INTO subtitles (video_id, language, label, file_key, file_url, is_auto_generated)
      VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT DO NOTHING`,
      [videoId, language, labels[language] || language, `subtitles/${videoId}/${language}.vtt`, vttRes.url]);
    if (transcript.text) await query('UPDATE videos SET transcript=$1 WHERE id=$2', [transcript.text, videoId]);
    await setStatus(jobId, 'completed', { srtUrl: srtRes.url, vttUrl: vttRes.url });
    await job.progress(100);
  } catch (err) {
    await setStatus(jobId, 'failed', {}, err.message);
    throw err;
  }
};

const processThumbnail = async (job) => {
  const { jobId, videoId, title, category } = job.data;
  try {
    await setStatus(jobId, 'processing');
    const outPath = path.join(__dirname, '../../uploads/temp', `thumb_${jobId}.jpg`);
    const thumbPath = await ai.generateAIThumbnail(title, category, outPath);
    await job.progress(70);
    if (thumbPath && fs.existsSync(thumbPath)) {
      const { url } = await uploadFile(thumbPath, `thumbnails/${videoId}/ai_thumb.jpg`, 'image/jpeg');
      await query('UPDATE videos SET ai_thumbnail_url=$1 WHERE id=$2', [url, videoId]);
      fs.unlinkSync(thumbPath);
      await setStatus(jobId, 'completed', { thumbnailUrl: url });
    } else {
      await setStatus(jobId, 'failed', {}, 'No thumbnail generated');
    }
    await job.progress(100);
  } catch (err) {
    await setStatus(jobId, 'failed', {}, err.message);
    throw err;
  }
};

const processTranslation = async (job) => {
  const { jobId, videoId, sourceLanguage, targetLanguage, segments } = job.data;
  try {
    await setStatus(jobId, 'processing');
    const translated = await ai.translateSubtitles(segments, targetLanguage, sourceLanguage);
    await job.progress(70);
    const vtt = ai.generateVTT(translated);
    const { url } = await uploadBuffer(Buffer.from(vtt), `subtitles/${videoId}/${targetLanguage}.vtt`, 'text/vtt');
    const labels = { ar: 'العربية', ru: 'Русский', en: 'English' };
    await query(`INSERT INTO subtitles (video_id, language, label, file_key, file_url, is_auto_generated)
      VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT DO NOTHING`,
      [videoId, targetLanguage, labels[targetLanguage] || targetLanguage, `subtitles/${videoId}/${targetLanguage}.vtt`, url]);
    await setStatus(jobId, 'completed', { vttUrl: url });
    await job.progress(100);
  } catch (err) {
    await setStatus(jobId, 'failed', {}, err.message);
    throw err;
  }
};

module.exports = { processScriptGeneration, processVoiceover, processSubtitles, processThumbnail, processTranslation };
