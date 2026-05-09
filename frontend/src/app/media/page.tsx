'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Download, BookOpen, Headphones, FileText, Radio, Filter, ExternalLink } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/lib/i18n';
import { useDebounce } from '@/hooks';

type MediaType = 'all' | 'nasheed' | 'lecture' | 'magazine' | 'pdf' | 'podcast';

const MEDIA_ITEMS = [
  { id: '1', type: 'nasheed', title_ar: 'طلع البدر علينا', title_ru: 'Талаа аль-Бадру Алайна', author_ar: 'أناشيد إسلامية', author_ru: 'Исламские нашиды', duration: '3:45', cover: '🌙', tag_ar: 'نشيد', tag_ru: 'Нашид', color: 'from-green-600 to-emerald-700' },
  { id: '2', type: 'nasheed', title_ar: 'يا طيبة', title_ru: 'Йа Тайба', author_ar: 'أناشيد المدينة', author_ru: 'Нашиды Медины', duration: '4:12', cover: '⭐', tag_ar: 'نشيد', tag_ru: 'Нашид', color: 'from-gold-600 to-amber-700' },
  { id: '3', type: 'lecture', title_ar: 'محاضرة: فضل العلم في الإسلام', title_ru: 'Лекция: Достоинство знания в исламе', author_ar: 'الشيخ أحمد محمد', author_ru: 'Шейх Ахмад Мухаммад', duration: '45:20', cover: '🎓', tag_ar: 'محاضرة', tag_ru: 'Лекция', color: 'from-blue-600 to-cyan-700' },
  { id: '4', type: 'lecture', title_ar: 'شرح الأربعين النووية', title_ru: 'Объяснение сорока хадисов ан-Навави', author_ar: 'د. عمر الفاروق', author_ru: 'Д-р Умар аль-Фарук', duration: '1:12:00', cover: '📚', tag_ar: 'درس', tag_ru: 'Урок', color: 'from-purple-600 to-violet-700' },
  { id: '5', type: 'magazine', title_ar: 'مجلة نور العلم — العدد الأول', title_ru: 'Журнал Нур аль-Ильм — Выпуск 1', author_ar: 'تحرير نور العلم', author_ru: 'Редакция Нур аль-Ильм', duration: '48 صفحة', cover: '📰', tag_ar: 'مجلة', tag_ru: 'Журнал', color: 'from-red-600 to-rose-700' },
  { id: '6', type: 'magazine', title_ar: 'مجلة الإسلام في روسيا', title_ru: 'Журнал Ислам в России', author_ar: 'المجلس الإسلامي', author_ru: 'Исламский совет', duration: '64 صفحة', cover: '🕌', tag_ar: 'مجلة', tag_ru: 'Журнал', color: 'from-teal-600 to-cyan-700' },
  { id: '7', type: 'pdf', title_ar: 'كتاب رياض الصالحين', title_ru: 'Книга Рияд ас-Салихин', author_ar: 'الإمام النووي', author_ru: 'Имам ан-Навави', duration: '320 صفحة', cover: '📖', tag_ar: 'كتاب', tag_ru: 'Книга', color: 'from-indigo-600 to-blue-700' },
  { id: '8', type: 'pdf', title_ar: 'مختصر صحيح البخاري', title_ru: 'Краткое изложение Сахих аль-Бухари', author_ar: 'الإمام البخاري', author_ru: 'Имам аль-Бухари', duration: '280 صفحة', cover: '📜', tag_ar: 'حديث', tag_ru: 'Хадис', color: 'from-amber-600 to-orange-700' },
  { id: '9', type: 'podcast', title_ar: 'بودكاست: حياة المسلم اليومية', title_ru: 'Подкаст: Повседневная жизнь мусульманина', author_ar: 'نور العلم', author_ru: 'Нур аль-Ильм', duration: '28:15', cover: '🎙️', tag_ar: 'بودكاست', tag_ru: 'Подкаст', color: 'from-pink-600 to-rose-700' },
  { id: '10', type: 'nasheed', title_ar: 'سبحان الله وبحمده', title_ru: 'Субханаллах ва бихамдих', author_ar: 'أناشيد الذكر', author_ru: 'Нашиды зикра', duration: '5:30', cover: '✨', tag_ar: 'نشيد', tag_ru: 'Нашид', color: 'from-green-500 to-teal-600' },
  { id: '11', type: 'podcast', title_ar: 'بودكاست: تفسير القرآن الكريم', title_ru: 'Подкаст: Тафсир Священного Корана', author_ar: 'الشيخ يوسف', author_ru: 'Шейх Юсуф', duration: '35:00', cover: '🌟', tag_ar: 'تفسير', tag_ru: 'Тафсир', color: 'from-gold-500 to-yellow-600' },
  { id: '12', type: 'lecture', title_ar: 'أحكام الصلاة كاملة', title_ru: 'Полные правила намаза', author_ar: 'د. فاطمة الزهراء', author_ru: 'Д-р Фатима аз-Захра', duration: '52:10', cover: '🕋', tag_ar: 'فقه', tag_ru: 'Фикх', color: 'from-blue-500 to-indigo-600' },
];

const TYPES: { key: MediaType; label_ar: string; label_ru: string; icon: React.ElementType }[] = [
  { key: 'all',      label_ar: 'الكل',       label_ru: 'Все',        icon: Filter },
  { key: 'nasheed',  label_ar: 'أناشيد',     label_ru: 'Нашиды',     icon: Headphones },
  { key: 'lecture',  label_ar: 'محاضرات',    label_ru: 'Лекции',     icon: Radio },
  { key: 'magazine', label_ar: 'مجلات',      label_ru: 'Журналы',    icon: BookOpen },
  { key: 'pdf',      label_ar: 'كتب وPDF',   label_ru: 'Книги/PDF',  icon: FileText },
  { key: 'podcast',  label_ar: 'بودكاست',    label_ru: 'Подкасты',   icon: Headphones },
];

export default function MediaPage() {
  const { locale } = useI18n();
  const [activeType, setActiveType] = useState<MediaType>('all');
  const [search, setSearch] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const filtered = MEDIA_ITEMS.filter(item => {
    const matchType = activeType === 'all' || item.type === activeType;
    const title = locale === 'ar' ? item.title_ar : item.title_ru;
    const matchSearch = !debouncedSearch || title.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchType && matchSearch;
  });

  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-16 geometric-bg">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-2xl">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white arabic-text mb-3">
                {t('المكتبة الإسلامية', 'Исламская библиотека')}
              </h1>
              <p className="text-gray-400 arabic-text max-w-2xl mx-auto">
                {t('أناشيد إسلامية، محاضرات، مجلات، كتب، وبودكاست — كل المحتوى حلال ومفيد', 'Исламские нашиды, лекции, журналы, книги и подкасты — весь контент халяль')}
              </p>
              {/* Halal notice */}
              <div className="inline-flex items-center gap-2 mt-4 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1.5">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-green-300 text-sm arabic-text">
                  {t('محتوى حلال 100% — بدون موسيقى محرمة', '100% халяль контент — без запрещённой музыки')}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('ابحث في المكتبة...', 'Поиск в библиотеке...')}
              className="input-field pr-12 text-base arabic-text w-full"
            />
          </div>

          {/* Type filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {TYPES.map(({ key, label_ar, label_ru, icon: Icon }) => (
              <button key={key} onClick={() => setActiveType(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all arabic-text ${activeType === key ? 'bg-islamic-green text-white shadow-lg shadow-green-900/30' : 'bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-4 h-4" />
                {locale === 'ar' ? label_ar : label_ru}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-sm arabic-text mb-6">
            {filtered.length} {t('عنصر', 'элементов')}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item, i) => {
              const isAudio = item.type === 'nasheed' || item.type === 'podcast' || item.type === 'lecture';
              const isDoc = item.type === 'pdf' || item.type === 'magazine';
              const isPlaying = playing === item.id;

              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  {/* Cover */}
                  <div className={`h-40 bg-gradient-to-br ${item.color} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 geometric-bg opacity-20" />
                    <span className="text-6xl relative z-10">{item.cover}</span>
                    <span className="absolute top-3 right-3 badge bg-white/20 text-white backdrop-blur-sm text-xs arabic-text">
                      {locale === 'ar' ? item.tag_ar : item.tag_ru}
                    </span>
                    {isAudio && (
                      <button
                        onClick={() => setPlaying(isPlaying ? null : item.id)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          {isPlaying
                            ? <span className="w-4 h-4 flex gap-1"><span className="w-1.5 h-4 bg-islamic-dark rounded-sm" /><span className="w-1.5 h-4 bg-islamic-dark rounded-sm" /></span>
                            : <Play className="w-6 h-6 text-islamic-dark ml-1" fill="currentColor" />
                          }
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground arabic-text text-sm line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                      {locale === 'ar' ? item.title_ar : item.title_ru}
                    </h3>
                    <p className="text-muted-foreground text-xs arabic-text mb-3">
                      {locale === 'ar' ? item.author_ar : item.author_ru}
                    </p>

                    {/* Playing indicator */}
                    {isPlaying && (
                      <div className="flex items-center gap-1.5 mb-3">
                        {[1, 2, 3, 4].map(b => (
                          <div key={b} className="w-1 bg-primary-500 rounded-full animate-bounce"
                            style={{ height: `${8 + b * 3}px`, animationDelay: `${b * 0.1}s` }} />
                        ))}
                        <span className="text-primary-600 text-xs arabic-text mr-1">
                          {t('يعزف الآن', 'Воспроизводится')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">{item.duration}</span>
                      <div className="flex gap-1.5">
                        {isAudio && (
                          <button
                            onClick={() => setPlaying(isPlaying ? null : item.id)}
                            className={`p-1.5 rounded-lg transition-colors ${isPlaying ? 'bg-primary-100 dark:bg-primary-950/30 text-primary-600' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                          >
                            <Play className="w-3.5 h-3.5" fill={isPlaying ? 'currentColor' : 'none'} />
                          </button>
                        )}
                        {isDoc && (
                          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Headphones className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground arabic-text text-lg">
                {t('لا توجد نتائج مطابقة', 'Результаты не найдены')}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
