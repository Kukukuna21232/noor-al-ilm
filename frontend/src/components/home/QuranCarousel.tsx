'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const VERSES = [
  { arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', ref_ar: 'سورة العلق: ١', ref_en: 'Al-Alaq 96:1', translation_ru: 'Читай во имя твоего Господа, Который сотворил', translation_en: 'Read in the name of your Lord who created' },
  { arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', ref_ar: 'سورة طه: ١١٤', ref_en: 'Ta-Ha 20:114', translation_ru: 'Господи, прибавь мне знания', translation_en: 'My Lord, increase me in knowledge' },
  { arabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', ref_ar: 'سورة المجادلة: ١١', ref_en: 'Al-Mujadila 58:11', translation_ru: 'Аллах возвысит тех из вас, кто уверовал, и тех, кому даровано знание', translation_en: 'Allah raises those who believe and those given knowledge in degrees' },
  { arabic: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', ref_ar: 'سورة فاطر: ٢٨', ref_en: 'Fatir 35:28', translation_ru: 'Воистину, боятся Аллаха из Его рабов только обладающие знанием', translation_en: 'Only those fear Allah, from His servants, who have knowledge' },
  { arabic: 'وَعَلَّمَ آدَمَ الْأَسْمَاءَ كُلَّهَا', ref_ar: 'سورة البقرة: ٣١', ref_en: 'Al-Baqarah 2:31', translation_ru: 'И научил Он Адама всем именам', translation_en: 'And He taught Adam the names of all things' },
];

export default function QuranCarousel() {
  const { locale } = useI18n();
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setCurrent(i => (i + 1) % VERSES.length), 6000);
    return () => clearInterval(timer);
  }, [auto]);

  const prev = () => { setAuto(false); setCurrent(i => (i - 1 + VERSES.length) % VERSES.length); };
  const next = () => { setAuto(false); setCurrent(i => (i + 1) % VERSES.length); };

  const verse = VERSES[current];

  return (
    <section className="py-16 bg-gradient-to-br from-islamic-dark to-islamic-navy relative overflow-hidden">
      <div className="absolute inset-0 geometric-bg opacity-15" />
      <div className="absolute inset-0 star-bg opacity-20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="mb-6">
          <span className="badge bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs px-4 py-1.5">
            {locale === 'ar' ? 'آيات قرآنية' : locale === 'ru' ? 'Аяты Корана' : 'Quranic Verses'}
          </span>
        </div>

        <div className="relative min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <p className="text-3xl md:text-4xl text-white arabic-quran mb-4 leading-loose px-8">
                {verse.arabic}
              </p>
              <p className="text-gold-400 text-sm arabic-text mb-3">{verse.ref_ar}</p>
              {locale !== 'ar' && (
                <p className="text-gray-300 text-base italic max-w-2xl mx-auto">
                  {locale === 'ru' ? verse.translation_ru : verse.translation_en}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={prev} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            {VERSES.map((_, i) => (
              <button key={i} onClick={() => { setAuto(false); setCurrent(i); }}
                className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-gold-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
