const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { query } = require('../../../shared/database');
const { cache } = require('../../../shared/redis');
const { authenticate, optionalAuth, apiRateLimit } = require('../middleware/auth');
const { aiQueue, moderationQueue } = require('../../../shared/queue');
const router = express.Router();

const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL })
  : null;

const aiLimiter = apiRateLimit(20, 60, (req) => `ai:${req.user?.id || req.ip}`);

// ── Islamic AI System Prompt ──────────────────────────────
const buildSystemPrompt = (language, category) => {
  const langName = { ar: 'Arabic', ru: 'Russian', en: 'English' }[language] || 'Arabic';
  return `You are "الإمام الذكي" (AI Imam), an advanced Islamic educational assistant for the Noor Al-Ilm platform.

LANGUAGE: Respond ONLY in ${langName}. Match the user's language exactly.

ROLE & EXPERTISE:
- Islamic education specialist with deep knowledge of Quran, Hadith, Fiqh, Islamic history, and Arabic language
- Category focus: ${category || 'general Islamic education'}
- Provide educational guidance based on mainstream Sunni Islamic scholarship
- Always cite sources: Quran verses (Surah:Verse), Hadith collections (Bukhari, Muslim, etc.)

RESPONSE FORMAT:
- Start with appropriate Islamic greeting when suitable
- Provide clear, structured educational answers
- Include relevant Quran/Hadith references with Arabic text when applicable
- Add confidence indicator: [HIGH/MEDIUM/LOW confidence]
- End with: "للفتاوى الشرعية، يُنصح باستشارة عالم متخصص" for legal rulings

STRICT GUIDELINES:
- Never issue formal fatwas - recommend qualified scholars for personal rulings
- Avoid controversial political topics
- Focus on education, not personal religious rulings
- Maintain respectful, scholarly tone
- For Arabic: use Modern Standard Arabic (فصحى)
- For Russian: use formal academic Russian

SAFETY: Refuse any request that contradicts Islamic values or promotes harm.`;
};

// ── POST /api/ai/chat ─────────────────────────────────────
router.post('/chat', optionalAuth, aiLimiter,
  [
    body('message').trim().isLength({ min: 1, max: 2000 }),
    body('language').optional().isIn(['ar', 'ru', 'en']),
    body('category').optional().isIn(['prayer', 'quran', 'hadith', 'history', 'arabic', 'fiqh', 'aqeedah', 'general']),
    body('conversationId').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message, language = 'ar', category = 'general', conversationId } = req.body;

    try {
      // Get or create conversation
      let convId = conversationId;
      if (!convId && req.user) {
        const { rows } = await query(
          'INSERT INTO ai_conversations (user_id, category, language) VALUES ($1,$2,$3) RETURNING id',
          [req.user.id, category, language]
        );
        convId = rows[0].id;
      }

      // Get conversation history
      let history = [];
      if (convId) {
        const { rows } = await query(
          'SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10',
          [convId]
        );
        history = rows.reverse();
      }

      // Build messages
      const messages = [
        { role: 'system', content: buildSystemPrompt(language, category) },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ];

      let responseText, tokensUsed = 0, modelUsed = 'fallback', confidence = 0.8;

      if (openai) {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          max_tokens: 1200,
          temperature: 0.6,
        });
        responseText = completion.choices[0].message.content;
        tokensUsed = completion.usage?.total_tokens || 0;
        modelUsed = completion.model;
      } else {
        responseText = getFallbackResponse(message, language, category);
      }

      // Extract references from response
      const references = extractReferences(responseText);

      // Save messages if authenticated
      if (convId && req.user) {
        await query('INSERT INTO ai_messages (conversation_id, role, content, tokens_used) VALUES ($1,$2,$3,$4)',
          [convId, 'user', message, 0]);
        await query('INSERT INTO ai_messages (conversation_id, role, content, references, confidence_score, tokens_used, model_used) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [convId, 'assistant', responseText, JSON.stringify(references), confidence, tokensUsed, modelUsed]);
        await query('UPDATE ai_conversations SET message_count = message_count + 2, updated_at = NOW() WHERE id = $1', [convId]);
      }

      // Queue moderation check (async)
      await moderationQueue().add('check-ai-response', { message, response: responseText, userId: req.user?.id }).catch(() => {});

      res.json({
        message: responseText,
        references,
        conversationId: convId,
        confidence,
        tokensUsed,
      });
    } catch (err) {
      console.error('AI chat error:', err);
      res.status(500).json({ error: 'AI service temporarily unavailable', fallback: getFallbackResponse(message, language, category) });
    }
  }
);

// ── POST /api/ai/generate-script ─────────────────────────
router.post('/generate-script', authenticate,
  [body('topic').trim().isLength({ min: 3, max: 500 }), body('language').isIn(['ar', 'ru', 'en']), body('duration').isInt({ min: 1, max: 30 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { topic, language = 'ar', duration = 5, style = 'educational', category = 'general', videoId } = req.body;
    const jobId = uuidv4();

    try {
      const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
      const creatorId = creatorRes.rows[0]?.id;

      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'script_gen','queued',$4)`,
        [jobId, creatorId, videoId || null, JSON.stringify({ topic, language, duration, style, category })]);

      await aiQueue().add('generate-script', { jobId, videoId, topic, language, duration, style, category });
      res.status(202).json({ jobId, message: 'Script generation queued' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to queue script generation' });
    }
  }
);

// ── POST /api/ai/generate-voiceover ──────────────────────
router.post('/generate-voiceover', authenticate,
  [body('text').trim().isLength({ min: 10, max: 5000 }), body('language').isIn(['ar', 'ru', 'en'])],
  async (req, res) => {
    const { text, language = 'ar', voice = 'alloy', videoId } = req.body;
    const jobId = uuidv4();
    try {
      const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'voiceover','queued',$4)`,
        [jobId, creatorRes.rows[0]?.id, videoId || null, JSON.stringify({ language, voice })]);
      await aiQueue().add('generate-voiceover', { jobId, videoId, text, language, voice });
      res.status(202).json({ jobId, message: 'Voiceover generation queued' });
    } catch {
      res.status(500).json({ error: 'Failed to queue voiceover' });
    }
  }
);

// ── POST /api/ai/generate-subtitles/:videoId ─────────────
router.post('/generate-subtitles/:videoId', authenticate, async (req, res) => {
  const { language = 'ar' } = req.body;
  const jobId = uuidv4();
  try {
    const { rows } = await query('SELECT id FROM videos WHERE id = $1', [req.params.videoId]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
    await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
      VALUES ($1,$2,$3,'subtitle_gen','queued',$4)`,
      [jobId, creatorRes.rows[0]?.id, req.params.videoId, JSON.stringify({ language })]);
    await aiQueue().add('generate-subtitles', { jobId, videoId: req.params.videoId, language });
    res.status(202).json({ jobId, message: 'Subtitle generation queued' });
  } catch {
    res.status(500).json({ error: 'Failed to queue subtitle generation' });
  }
});

// ── POST /api/ai/translate-subtitles/:videoId ────────────
router.post('/translate-subtitles/:videoId', authenticate,
  [body('targetLanguage').isIn(['ar', 'ru', 'en']), body('sourceLanguage').isIn(['ar', 'ru', 'en'])],
  async (req, res) => {
    const { targetLanguage, sourceLanguage = 'ar' } = req.body;
    const jobId = uuidv4();
    try {
      const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
      await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
        VALUES ($1,$2,$3,'translation','queued',$4)`,
        [jobId, creatorRes.rows[0]?.id, req.params.videoId, JSON.stringify({ sourceLanguage, targetLanguage })]);
      await aiQueue().add('translate-subtitles', { jobId, videoId: req.params.videoId, sourceLanguage, targetLanguage, segments: [] });
      res.status(202).json({ jobId, message: 'Translation queued' });
    } catch {
      res.status(500).json({ error: 'Failed to queue translation' });
    }
  }
);

// ── POST /api/ai/generate-thumbnail/:videoId ─────────────
router.post('/generate-thumbnail/:videoId', authenticate, async (req, res) => {
  const jobId = uuidv4();
  try {
    const { rows } = await query('SELECT id, title, category FROM videos WHERE id = $1', [req.params.videoId]);
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
    await query(`INSERT INTO ai_generation_jobs (id, creator_id, video_id, job_type, status, input_data)
      VALUES ($1,$2,$3,'thumbnail','queued',$4)`,
      [jobId, creatorRes.rows[0]?.id, req.params.videoId, JSON.stringify({ title: rows[0].title, category: rows[0].category })]);
    await aiQueue().add('generate-thumbnail', { jobId, videoId: req.params.videoId, title: rows[0].title, category: rows[0].category });
    res.status(202).json({ jobId, message: 'Thumbnail generation queued' });
  } catch {
    res.status(500).json({ error: 'Failed to queue thumbnail generation' });
  }
});

// ── GET /api/ai/conversations ─────────────────────────────
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, title, category, language, message_count, created_at, updated_at FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ conversations: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ── GET /api/ai/conversations/:id ────────────────────────
router.get('/conversations/:id', authenticate, async (req, res) => {
  try {
    const { rows: conv } = await query('SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!conv[0]) return res.status(404).json({ error: 'Conversation not found' });
    const { rows: messages } = await query('SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ conversation: conv[0], messages });
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// ── DELETE /api/ai/conversations/:id ─────────────────────
router.delete('/conversations/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Conversation deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ── GET /api/ai/job/:jobId ────────────────────────────────
router.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM ai_generation_jobs WHERE id = $1', [req.params.jobId]);
    if (!rows[0]) return res.status(404).json({ error: 'Job not found' });
    res.json({ job: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// ── GET /api/ai/jobs ──────────────────────────────────────
router.get('/jobs', authenticate, async (req, res) => {
  try {
    const creatorRes = await query('SELECT id FROM creators WHERE user_id = $1', [req.user.id]);
    if (!creatorRes.rows[0]) return res.json({ jobs: [] });
    const { rows } = await query('SELECT * FROM ai_generation_jobs WHERE creator_id = $1 ORDER BY created_at DESC LIMIT 50', [creatorRes.rows[0].id]);
    res.json({ jobs: rows });
  } catch {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ── Helpers ───────────────────────────────────────────────
function extractReferences(text) {
  const refs = [];
  const quranRegex = /\((\d+):(\d+)\)/g;
  let match;
  while ((match = quranRegex.exec(text)) !== null) {
    refs.push({ type: 'quran', surah: parseInt(match[1]), verse: parseInt(match[2]) });
  }
  const hadithKeywords = ['البخاري', 'مسلم', 'أبو داود', 'الترمذي', 'النسائي', 'ابن ماجه', 'Bukhari', 'Muslim'];
  hadithKeywords.forEach(kw => {
    if (text.includes(kw)) refs.push({ type: 'hadith', collection: kw });
  });
  return [...new Map(refs.map(r => [JSON.stringify(r), r])).values()];
}

function getFallbackResponse(message, language, category) {
  const responses = {
    ar: {
      prayer: 'الصلاة عماد الدين وهي الركن الثاني من أركان الإسلام. تُؤدَّى خمس مرات يومياً. للمزيد من التفاصيل، يُرجى الرجوع إلى كتب الفقه المعتمدة.',
      quran: 'القرآن الكريم هو كلام الله المنزَّل على سيدنا محمد ﷺ. قال تعالى: ﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ (15:9)',
      general: 'بارك الله فيك على سؤالك. الإسلام دين شامل يهتم بجميع جوانب الحياة. للحصول على إجابة دقيقة، يُنصح بمراجعة العلماء المتخصصين.',
    },
    ru: {
      general: 'Джазакумуллаху хайран за ваш вопрос. Ислам — это всеобъемлющая религия, охватывающая все аспекты жизни. Для получения точного ответа рекомендуется обратиться к квалифицированным учёным.',
    },
    en: {
      general: 'Thank you for your question. Islam is a comprehensive religion that addresses all aspects of life. For accurate guidance, please consult qualified Islamic scholars.',
    },
  };
  return responses[language]?.[category] || responses[language]?.general || responses.ar.general;
}

module.exports = router;
