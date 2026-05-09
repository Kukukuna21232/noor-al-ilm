const express = require('express');
const { query } = require('../../../shared/database');
const { cache } = require('../../../shared/redis');
const { authenticate, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// ── GET /api/quran/surahs ─────────────────────────────────
router.get('/surahs', async (req, res) => {
  try {
    const cached = await cache.get('quran:surahs').catch(() => null);
    if (cached) return res.json(cached);

    const { rows } = await query('SELECT * FROM quran_surahs ORDER BY id');
    const result = { surahs: rows };
    await cache.set('quran:surahs', result, 3600).catch(() => {});
    res.json(result);
  } catch {
    // Return sample data if DB not seeded
    res.json({ surahs: getSampleSurahs() });
  }
});

// ── GET /api/quran/surahs/:id/verses ─────────────────────
router.get('/surahs/:id/verses', optionalAuth, async (req, res) => {
  try {
    const { lang = 'ar' } = req.query;
    const cacheKey = `quran:surah:${req.params.id}:${lang}`;
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached) return res.json(cached);

    const { rows } = await query(
      'SELECT * FROM quran_verses WHERE surah_id = $1 ORDER BY verse_number',
      [req.params.id]
    );

    const result = { verses: rows, surahId: parseInt(req.params.id) };
    await cache.set(cacheKey, result, 3600).catch(() => {});
    res.json(result);
  } catch {
    res.json({ verses: getSampleVerses(parseInt(req.params.id)), surahId: parseInt(req.params.id) });
  }
});

// ── GET /api/quran/search ─────────────────────────────────
router.get('/search', async (req, res) => {
  const { q, lang = 'ar' } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query too short' });

  try {
    const { rows } = await query(`
      SELECT v.*, s.name_arabic as surah_name, s.name_english as surah_name_en
      FROM quran_verses v JOIN quran_surahs s ON v.surah_id = s.id
      WHERE v.text_arabic ILIKE $1 OR v.translation_en ILIKE $1 OR v.translation_ru ILIKE $1
      LIMIT 20
    `, [`%${q}%`]);
    res.json({ results: rows, query: q });
  } catch {
    res.json({ results: [], query: q });
  }
});

// ── GET /api/quran/progress ───────────────────────────────
router.get('/progress', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT qp.*, qs.name_arabic as surah_name, qv.verse_number
      FROM quran_progress qp
      LEFT JOIN quran_surahs qs ON qp.surah_id = qs.id
      LEFT JOIN quran_verses qv ON qp.verse_id = qv.id
      WHERE qp.user_id = $1 ORDER BY qp.updated_at DESC
    `, [req.user.id]);

    const stats = {
      total: rows.length,
      completed: rows.filter(r => r.status === 'completed').length,
      memorized: rows.filter(r => r.progress_type === 'memorization' && r.status === 'completed').length,
    };

    res.json({ progress: rows, stats });
  } catch {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// ── POST /api/quran/progress ──────────────────────────────
router.post('/progress', authenticate, async (req, res) => {
  const { surahId, verseId, progressType, status, accuracyScore } = req.body;
  try {
    const { rows } = await query(`
      INSERT INTO quran_progress (user_id, surah_id, verse_id, progress_type, status, accuracy_score, last_reviewed)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT (user_id, verse_id, progress_type) DO UPDATE SET
        status = $5, accuracy_score = $6, repetitions = quran_progress.repetitions + 1,
        last_reviewed = NOW(), updated_at = NOW()
      RETURNING *
    `, [req.user.id, surahId, verseId, progressType, status, accuracyScore]);
    res.json({ progress: rows[0] });
  } catch {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// ── GET /api/quran/prayer-times ───────────────────────────
router.get('/prayer-times', async (req, res) => {
  const { city = 'Mecca', country = 'SA', method = 4 } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `prayer:${city}:${country}:${today}`;

  try {
    const cached = await cache.get(cacheKey).catch(() => null);
    if (cached) return res.json(cached);

    // Check DB cache
    const { rows } = await query(
      'SELECT * FROM prayer_times_cache WHERE city = $1 AND country = $2 AND date = $3',
      [city, country, today]
    );

    if (rows[0]) {
      const result = { times: rows[0], city, country, date: today };
      await cache.set(cacheKey, result, 3600).catch(() => {});
      return res.json(result);
    }

    // Fetch from external API
    const axios = require('axios');
    const response = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity/${today}?city=${city}&country=${country}&method=${method}`,
      { timeout: 5000 }
    );

    const t = response.data.data.timings;
    const times = { fajr: t.Fajr, sunrise: t.Sunrise, dhuhr: t.Dhuhr, asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha };

    // Cache in DB
    await query(`
      INSERT INTO prayer_times_cache (city, country, date, fajr, sunrise, dhuhr, asr, maghrib, isha, method)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (city, country, date) DO NOTHING
    `, [city, country, today, times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha, parseInt(method)]);

    const result = { times, city, country, date: today };
    await cache.set(cacheKey, result, 3600).catch(() => {});
    res.json(result);
  } catch {
    // Fallback times
    res.json({ times: { fajr: '05:12', sunrise: '06:30', dhuhr: '12:30', asr: '15:45', maghrib: '18:22', isha: '19:52' }, city, country, date: today, fallback: true });
  }
});

// ── GET /api/quran/islamic-events ─────────────────────────
router.get('/islamic-events', async (req, res) => {
  try {
    const cached = await cache.get('islamic:events').catch(() => null);
    if (cached) return res.json(cached);
    const { rows } = await query('SELECT * FROM islamic_events ORDER BY hijri_month, hijri_day');
    const result = { events: rows };
    await cache.set('islamic:events', result, 86400).catch(() => {});
    res.json(result);
  } catch {
    res.json({ events: [] });
  }
});

// ── Sample data fallbacks ─────────────────────────────────
function getSampleSurahs() {
  return [
    { id: 1, name_arabic: 'الفاتحة', name_transliteration: 'Al-Fatihah', name_english: 'The Opening', revelation_type: 'Meccan', verses_count: 7, order_index: 1 },
    { id: 2, name_arabic: 'البقرة', name_transliteration: 'Al-Baqarah', name_english: 'The Cow', revelation_type: 'Medinan', verses_count: 286, order_index: 2 },
    { id: 3, name_arabic: 'آل عمران', name_transliteration: 'Ali Imran', name_english: 'Family of Imran', revelation_type: 'Medinan', verses_count: 200, order_index: 3 },
    { id: 112, name_arabic: 'الإخلاص', name_transliteration: 'Al-Ikhlas', name_english: 'Sincerity', revelation_type: 'Meccan', verses_count: 4, order_index: 112 },
    { id: 113, name_arabic: 'الفلق', name_transliteration: 'Al-Falaq', name_english: 'The Daybreak', revelation_type: 'Meccan', verses_count: 5, order_index: 113 },
    { id: 114, name_arabic: 'الناس', name_transliteration: 'An-Nas', name_english: 'Mankind', revelation_type: 'Meccan', verses_count: 6, order_index: 114 },
  ];
}

function getSampleVerses(surahId) {
  if (surahId === 1) return [
    { id: '1', surah_id: 1, verse_number: 1, text_arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation_en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', translation_ru: 'Во имя Аллаха, Милостивого, Милосердного!' },
    { id: '2', surah_id: 1, verse_number: 2, text_arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation_en: '[All] praise is [due] to Allah, Lord of the worlds', translation_ru: 'Хвала Аллаху, Господу миров,' },
    { id: '3', surah_id: 1, verse_number: 3, text_arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation_en: 'The Entirely Merciful, the Especially Merciful,', translation_ru: 'Милостивому, Милосердному,' },
    { id: '4', surah_id: 1, verse_number: 4, text_arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation_en: 'Sovereign of the Day of Recompense.', translation_ru: 'Властелину Дня воздаяния!' },
    { id: '5', surah_id: 1, verse_number: 5, text_arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation_en: 'It is You we worship and You we ask for help.', translation_ru: 'Тебе одному мы поклоняемся и Тебя одного молим о помощи.' },
    { id: '6', surah_id: 1, verse_number: 6, text_arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation_en: 'Guide us to the straight path', translation_ru: 'Веди нас прямым путём,' },
    { id: '7', surah_id: 1, verse_number: 7, text_arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation_en: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', translation_ru: 'путём тех, кого Ты облагодетельствовал, не тех, на кого пал гнев, и не заблудших.' },
  ];
  return [];
}

module.exports = router;
