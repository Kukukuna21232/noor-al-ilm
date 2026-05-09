'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { quranApi } from '@/lib/api';

interface PrayerTimes { fajr: string; sunrise?: string; dhuhr: string; asr: string; maghrib: string; isha: string; }

const PRAYERS = [
  { key: 'fajr',    i18nKey: 'home.prayer.fajr',    emoji: '🌙' },
  { key: 'dhuhr',   i18nKey: 'home.prayer.dhuhr',   emoji: '☀️' },
  { key: 'asr',     i18nKey: 'home.prayer.asr',     emoji: '🌤️' },
  { key: 'maghrib', i18nKey: 'home.prayer.maghrib', emoji: '🌅' },
  { key: 'isha',    i18nKey: 'home.prayer.isha',    emoji: '🌃' },
] as const;

export default function PrayerWidget() {
  const { t, locale } = useI18n();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [city, setCity] = useState('Mecca');
  const [now, setNow] = useState(new Date());
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    quranApi.getPrayerTimes(city, 'SA')
      .then((res: unknown) => { const data = res as { times?: PrayerTimes }; if (data?.times) setTimes(data.times); })
      .catch(() => setTimes({ fajr: '05:12', dhuhr: '12:30', asr: '15:45', maghrib: '18:22', isha: '19:52' }))
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    if (!times) return;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYERS) {
      const t = times[p.key as keyof PrayerTimes];
      if (!t) continue;
      const [h, m] = t.split(':').map(Number);
      if (h * 60 + m > nowMins) { setNextPrayer(p.key); return; }
    }
    setNextPrayer('fajr');
  }, [times, now]);

  const timeStr = now.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <section className="py-16 bg-gradient-to-br from-islamic-dark to-islamic-navy text-white geometric-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl md:text-3xl font-bold arabic-text text-gold-400">{t('home.prayer.title')}</h2>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
            <MapPin className="w-4 h-4" /><span>{city}</span>
          </div>
          <p className="text-4xl font-mono text-white tracking-wider">{timeStr}</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {PRAYERS.map(p => <div key={p.key} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {PRAYERS.map((prayer, i) => {
              const isNext = nextPrayer === prayer.key;
              const timeVal = times?.[prayer.key as keyof PrayerTimes] ?? '--:--';
              return (
                <motion.div key={prayer.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`prayer-card ${isNext ? 'ring-2 ring-gold-400 bg-gold-500/20' : 'bg-white/5'}`}
                >
                  {isNext && <span className="badge bg-gold-500 text-white mb-2 text-xs arabic-text">{t('home.prayer.next')}</span>}
                  <span className="text-2xl mb-1 block">{prayer.emoji}</span>
                  <p className="text-gold-400 font-bold arabic-text text-base">{t(prayer.i18nKey)}</p>
                  <p className="text-white text-xl font-mono mt-1">{timeVal}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
