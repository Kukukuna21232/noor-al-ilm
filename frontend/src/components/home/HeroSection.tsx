'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, Star, ArrowLeft, ArrowRight, Play, Sparkles, Globe, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';

const QURAN_VERSES = [
  { arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', ref: 'العلق: ١', en: 'Read in the name of your Lord who created' },
  { arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', ref: 'طه: ١١٤', en: 'My Lord, increase me in knowledge' },
  { arabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', ref: 'المجادلة: ١١', en: 'Allah raises those who believe and those given knowledge in degrees' },
  { arabic: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', ref: 'فاطر: ٢٨', en: 'Only those fear Allah, from His servants, who have knowledge' },
];

const FLOATING_WORDS = ['بِسْمِ اللَّهِ', 'الرَّحْمَنِ', 'الرَّحِيمِ', 'اقْرَأْ', 'عَلَّمَ', 'الْقَلَمَ', 'نُورٌ', 'عِلْمٌ'];

const STATS = [
  { icon: Users, value: '50,000+', labelKey: 'home.hero.stats.students', color: 'text-green-400' },
  { icon: BookOpen, value: '500+', labelKey: 'home.hero.stats.courses', color: 'text-blue-400' },
  { icon: Star, value: '120+', labelKey: 'home.hero.stats.teachers', color: 'text-gold-400' },
  { icon: Globe, value: '80+', labelKey: 'home.hero.stats.countries', color: 'text-purple-400' },
];

export default function HeroSection() {
  const { t, dir, locale } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const [verseIndex, setVerseIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const timer = setInterval(() => setVerseIndex(i => (i + 1) % QURAN_VERSES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#0c1220' }}>
      {/* Subtle geometric background */}
      <div className="absolute inset-0 geometric-bg opacity-5" />
      <div className="absolute inset-0 star-bg opacity-10" />

      {/* Floating Arabic words - very subtle */}
      {FLOATING_WORDS.map((word, i) => (
        <motion.div key={i}
          className="absolute text-c9a84c/5 text-xl md:text-3xl font-bold arabic-text select-none pointer-events-none"
          style={{ left: `${5 + i * 12}%`, top: `${10 + (i % 4) * 20}%` }}
          animate={{ y: [0, -15, 0], opacity: [0.02, 0.06, 0.02] }}
          transition={{ duration: 6 + i * 0.8, repeat: Infinity, delay: i * 0.7 }}
        >
          {word}
        </motion.div>
      ))}

      <motion.div style={{ opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left/Right content ── */}
          <motion.div initial={{ opacity: 0, x: dir === 'rtl' ? 60 : -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
            className={dir === 'rtl' ? 'text-right' : 'text-left'}>

            {/* Bismillah - centered, gold */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-center mb-8">
              <span className="arabic-text text-2xl md:text-3xl" style={{ color: '#c9a84c' }}>
                {t('home.hero.bismillah')}
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold text-center mb-6 leading-tight" style={{ color: '#f0ece0' }}>
              {t('home.hero.title')}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-center mb-6 font-semibold" style={{ color: '#f0ece0' }}>
              {t('home.hero.subtitle')}
            </motion.p>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-base md:text-lg text-center mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(240, 236, 224, 0.7)' }}>
              {t('home.hero.description')}
            </motion.p>

            {/* CTAs - centered */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center mb-12">
              {!isAuthenticated ? (
                <>
                  <Link href="/auth/register" className="btn-gold text-base px-8 py-4">
                    {t('home.hero.cta')} <ArrowIcon className="w-5 h-5" />
                  </Link>
                  <Link href="/courses" className="btn-outline text-base px-8 py-4 flex items-center gap-2">
                    {t('home.hero.ctaSecondary')}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="btn-gold text-base px-8 py-4">
                    {t('nav.dashboard')} <ArrowIcon className="w-5 h-5" />
                  </Link>
                  <Link href="/ask-imam" className="btn-outline text-base px-8 py-4 flex items-center gap-2">
                    <Zap className="w-5 h-5" style={{ color: '#c9a84c' }} /> {t('nav.askImam')}
                  </Link>
                </>
              )}
            </motion.div>

            {/* Stats - grid of 4 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {STATS.map(({ icon: Icon, value, labelKey }) => (
                <div key={labelKey} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a6b3c' }}>
                    <Icon className="w-6 h-6" style={{ color: '#f0ece0' }} />
                  </div>
                  <p className="font-bold text-lg mb-1" style={{ color: '#c9a84c' }}>{value}</p>
                  <p className="text-xs arabic-text" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>{t(labelKey)}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Visual panel ── */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3 }}
            className="hidden lg:flex flex-col gap-4 items-center">

            {/* Quran verse card */}
            <div className="card p-8 w-full max-w-sm text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1a6b3c' }}>
                <span className="text-3xl arabic-text font-bold" style={{ color: '#f0ece0' }}>ق</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={verseIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
                  <p className="text-xl arabic-text font-bold mb-3 leading-relaxed" style={{ color: '#f0ece0' }}>
                    {QURAN_VERSES[verseIndex].arabic}
                  </p>
                  <p className="text-xs mb-2" style={{ color: '#c9a84c' }}>{QURAN_VERSES[verseIndex].ref}</p>
                  {locale !== 'ar' && <p className="text-xs italic" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>{QURAN_VERSES[verseIndex].en}</p>}
                </motion.div>
              </AnimatePresence>
              {/* Verse dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {QURAN_VERSES.map((_, i) => (
                  <button key={i} onClick={() => setVerseIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === verseIndex ? 'w-4' : ''}`}
                    style={{ 
                      backgroundColor: i === verseIndex ? '#c9a84c' : 'rgba(240, 236, 224, 0.2)' 
                    }} />
                ))}
              </div>
            </div>

            {/* Feature mini-cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { icon: '🤖', label: 'AI Imam', sublabel: locale === 'ar' ? 'اسأل الإمام' : 'Ask Imam', href: '/ask-imam' },
                { icon: '📖', label: locale === 'ar' ? 'القرآن' : 'Quran', sublabel: locale === 'ar' ? 'تعلم وحفظ' : 'Learn & Memorize', href: '/quran' },
                { icon: '🎬', label: locale === 'ar' ? 'فيديو' : 'Video', sublabel: locale === 'ar' ? 'تعليمي' : 'Educational', href: '/watch' },
                { icon: '🌐', label: locale === 'ar' ? 'مجتمع' : 'Community', sublabel: locale === 'ar' ? 'عالمي' : 'Global', href: '/forum' },
              ].map(({ icon, label, sublabel, href }) => (
                <Link key={href} href={href}
                  className="card p-4 text-center hover:scale-105 transition-transform group">
                  <span className="text-2xl block mb-1">{icon}</span>
                  <p className="text-sm font-bold mb-1" style={{ color: '#f0ece0' }}>{label}</p>
                  <p className="text-xs arabic-text" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>{sublabel}</p>
                </Link>
              ))}
            </div>

            {/* Live indicator */}
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-xs arabic-text" style={{ color: '#f0ece0' }}>{locale === 'ar' ? 'بث مباشر متاح الآن' : 'Live stream available'}</span>
              <Link href="/live" className="text-xs hover:underline" style={{ color: '#c9a84c' }}>
                {locale === 'ar' ? 'شاهد' : 'Watch'}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 100L1440 100L1440 50C1200 100 960 0 720 50C480 100 240 0 0 50L0 100Z" fill="#0c1220" />
        </svg>
      </div>
    </section>
  );
}
