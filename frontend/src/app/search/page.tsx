'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Video, MessageSquare, FileText, Loader2, ArrowRight, ArrowLeft, Star, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/lib/i18n';
import { useDebounce } from '@/hooks';
import { formatNumber } from '@/lib/utils';

type SearchTab = 'all' | 'courses' | 'videos' | 'forum' | 'quran';

// Mock search results
const MOCK_RESULTS = {
  courses: [
    { id: '1', title_ar: 'أحكام التجويد للمبتدئين', title_ru: 'Правила таджвида для начинающих', instructor: 'الشيخ أحمد', rating: 4.9, students: 1240, price: 0 },
    { id: '2', title_ar: 'اللغة العربية من الصفر', title_ru: 'Арабский язык с нуля', instructor: 'د. فاطمة', rating: 4.8, students: 890, price: 0 },
    { id: '3', title_ar: 'التاريخ الإسلامي الشامل', title_ru: 'Полная история ислама', instructor: 'د. عمر', rating: 4.7, students: 650, price: 49 },
  ],
  videos: [
    { id: '1', title_ar: 'مقدمة في أحكام التجويد', title_ru: 'Введение в таджвид', channel: 'الشيخ أحمد', views: 12400, duration: '20:45', thumb: '📖' },
    { id: '2', title_ar: 'شرح سورة الفاتحة', title_ru: 'Объяснение суры Аль-Фатиха', channel: 'نور العلم', views: 8200, duration: '18:30', thumb: '🌙' },
  ],
  forum: [
    { id: '1', title_ar: 'ما هي أفضل طريقة لحفظ القرآن؟', title_ru: 'Как лучше всего запомнить Коран?', replies: 24, likes: 87, category: 'القرآن' },
    { id: '2', title_ar: 'كيف أتعلم اللغة العربية بسرعة؟', title_ru: 'Как быстро выучить арабский?', replies: 18, likes: 65, category: 'العربية' },
  ],
  quran: [
    { id: '1', surah: 'الفاتحة', verse: 1, text_ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation_ru: 'Во имя Аллаха, Милостивого, Милосердного!' },
    { id: '2', surah: 'البقرة', verse: 255, text_ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation_ru: 'Аллах — нет божества, кроме Него, Живого, Вечносущего.' },
  ],
};

const TABS: { key: SearchTab; label_ar: string; label_ru: string; icon: React.ElementType; count: number }[] = [
  { key: 'all',    label_ar: 'الكل',       label_ru: 'Все',        icon: Search,       count: 9 },
  { key: 'courses',label_ar: 'الدورات',    label_ru: 'Курсы',      icon: BookOpen,     count: 3 },
  { key: 'videos', label_ar: 'الفيديوهات', label_ru: 'Видео',      icon: Video,        count: 2 },
  { key: 'forum',  label_ar: 'المنتدى',    label_ru: 'Форум',      icon: MessageSquare,count: 2 },
  { key: 'quran',  label_ar: 'القرآن',     label_ru: 'Коран',      icon: FileText,     count: 2 },
];

const SUGGESTIONS_AR = ['أحكام التجويد', 'سورة الفاتحة', 'اللغة العربية', 'التاريخ الإسلامي', 'الصلاة', 'الزكاة', 'رمضان'];
const SUGGESTIONS_RU = ['Таджвид', 'Намаз', 'Арабский язык', 'История ислама', 'Рамадан', 'Закят', 'Коран'];

function SearchContent() {
  const { locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('q'));
  const debouncedQuery = useDebounce(query, 500);
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => { setIsSearching(false); setHasSearched(true); }, 600);
      return () => clearTimeout(timer);
    }
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query)}`); setHasSearched(true); }
  };

  const showCourses = activeTab === 'all' || activeTab === 'courses';
  const showVideos  = activeTab === 'all' || activeTab === 'videos';
  const showForum   = activeTab === 'all' || activeTab === 'forum';
  const showQuran   = activeTab === 'all' || activeTab === 'quran';

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Search header */}
        <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-14 geometric-bg">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white arabic-text mb-2">{t('البحث الشامل', 'Глобальный поиск')}</h1>
              <p className="text-gray-400 arabic-text text-sm">{t('ابحث في الدورات، الفيديوهات، المنتدى، والقرآن', 'Поиск по курсам, видео, форуму и Корану')}</p>
            </motion.div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('ابحث عن أي شيء...', 'Искать что угодно...')}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-gray-400 rounded-2xl px-6 py-4 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 arabic-text"
                autoFocus
              />
              {isSearching && <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />}
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* No query — show suggestions */}
          {!hasSearched && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <p className="text-muted-foreground text-sm arabic-text mb-4 text-center">{t('اقتراحات البحث:', 'Предложения для поиска:')}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(locale === 'ar' ? SUGGESTIONS_AR : SUGGESTIONS_RU).map(s => (
                  <button key={s} onClick={() => { setQuery(s); setHasSearched(true); }}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-primary-600 hover:border-primary-300 transition-all arabic-text">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {hasSearched && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 flex-wrap mb-8 border-b border-border pb-4">
                {TABS.map(({ key, label_ar, label_ru, icon: Icon, count }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all arabic-text ${activeTab === key ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                    {locale === 'ar' ? label_ar : label_ru}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-white/20' : 'bg-muted'}`}>{count}</span>
                  </button>
                ))}
              </div>

              <p className="text-muted-foreground text-sm arabic-text mb-6">
                {isSearching
                  ? t('جاري البحث...', 'Поиск...')
                  : t(`نتائج البحث عن: "${query}"`, `Результаты поиска: "${query}"`)}
              </p>

              <AnimatePresence>
                {isSearching ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">

                    {/* Courses */}
                    {showCourses && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-foreground arabic-text flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-600" />{t('الدورات', 'Курсы')}</h2>
                          <Link href="/courses" className="text-primary-600 text-sm hover:underline arabic-text flex items-center gap-1">{t('عرض الكل', 'Все')} <ArrowIcon className="w-3.5 h-3.5" /></Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {MOCK_RESULTS.courses.map((c, i) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                              <Link href={`/courses/${c.id}`} className="block bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary-300 transition-all group">
                                <h3 className="font-bold text-foreground arabic-text group-hover:text-primary-600 transition-colors mb-2">{locale === 'ar' ? c.title_ar : c.title_ru}</h3>
                                <p className="text-muted-foreground text-xs arabic-text mb-3">{c.instructor}</p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /><span className="font-medium text-foreground">{c.rating}</span></div>
                                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{formatNumber(c.students)}</span></div>
                                  <span className={`font-bold ${c.price === 0 ? 'text-green-600' : 'text-foreground'}`}>{c.price === 0 ? t('مجاني', 'Бесплатно') : `$${c.price}`}</span>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Videos */}
                    {showVideos && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-foreground arabic-text flex items-center gap-2"><Video className="w-5 h-5 text-purple-600" />{t('الفيديوهات', 'Видео')}</h2>
                          <Link href="/watch" className="text-primary-600 text-sm hover:underline arabic-text flex items-center gap-1">{t('عرض الكل', 'Все')} <ArrowIcon className="w-3.5 h-3.5" /></Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {MOCK_RESULTS.videos.map((v, i) => (
                            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                              <Link href={`/watch/${v.id}`} className="flex gap-3 bg-card border border-border rounded-2xl p-3 hover:shadow-lg hover:border-primary-300 transition-all group">
                                <div className="w-28 h-16 rounded-xl bg-gradient-to-br from-islamic-green/40 to-primary-700/40 flex items-center justify-center shrink-0 text-3xl relative">
                                  {v.thumb}
                                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded font-mono">{v.duration}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-foreground arabic-text text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">{locale === 'ar' ? v.title_ar : v.title_ru}</h3>
                                  <p className="text-muted-foreground text-xs arabic-text mt-1">{v.channel}</p>
                                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" /><span>{formatNumber(v.views)}</span></div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Forum */}
                    {showForum && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-foreground arabic-text flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-600" />{t('المنتدى', 'Форум')}</h2>
                          <Link href="/forum" className="text-primary-600 text-sm hover:underline arabic-text flex items-center gap-1">{t('عرض الكل', 'Все')} <ArrowIcon className="w-3.5 h-3.5" /></Link>
                        </div>
                        <div className="space-y-3">
                          {MOCK_RESULTS.forum.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                              <Link href={`/forum/${p.id}`} className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary-300 transition-all group">
                                <div className="flex-1 min-w-0">
                                  <span className="badge badge-primary text-xs arabic-text mb-1">{p.category}</span>
                                  <h3 className="font-bold text-foreground arabic-text group-hover:text-primary-600 transition-colors">{locale === 'ar' ? p.title_ar : p.title_ru}</h3>
                                </div>
                                <div className="flex gap-3 text-xs text-muted-foreground shrink-0 mr-4">
                                  <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p.replies}</div>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Quran */}
                    {showQuran && (
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-bold text-foreground arabic-text flex items-center gap-2"><FileText className="w-5 h-5 text-green-600" />{t('القرآن الكريم', 'Священный Коран')}</h2>
                          <Link href="/quran" className="text-primary-600 text-sm hover:underline arabic-text flex items-center gap-1">{t('عرض الكل', 'Все')} <ArrowIcon className="w-3.5 h-3.5" /></Link>
                        </div>
                        <div className="space-y-3">
                          {MOCK_RESULTS.quran.map((v, i) => (
                            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                              <Link href="/quran" className="block bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary-300 transition-all group">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="badge badge-primary text-xs arabic-text">{v.surah}</span>
                                  <span className="text-muted-foreground text-xs">{t('آية', 'Аят')} {v.verse}</span>
                                </div>
                                <p className="text-xl arabic-text text-foreground leading-loose mb-2">{v.text_ar}</p>
                                {locale !== 'ar' && <p className="text-sm text-muted-foreground italic">{v.translation_ru}</p>}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      </MainLayout>
    }>
      <SearchContent />
    </Suspense>
  );
}
