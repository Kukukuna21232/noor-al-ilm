'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Users, Clock, BookOpen, Play, Award } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { coursesApi } from '@/lib/api';
import { useDebounce } from '@/hooks';
import { SkeletonCard, EmptyState, Badge, Progress } from '@/components/ui';
import { formatNumber, CATEGORY_COLORS } from '@/lib/utils';
import type { Course } from '@/types';

const CATEGORIES = [
  { key: 'all', label_ar: 'الكل', label_ru: 'Все' },
  { key: 'quranStudies', label_ar: 'علوم القرآن', label_ru: 'Коранические науки' },
  { key: 'arabic', label_ar: 'اللغة العربية', label_ru: 'Арабский язык' },
  { key: 'history', label_ar: 'التاريخ الإسلامي', label_ru: 'История ислама' },
  { key: 'fiqh', label_ar: 'الفقه الإسلامي', label_ru: 'Исламское право' },
  { key: 'aqeedah', label_ar: 'العقيدة', label_ru: 'Акыда' },
  { key: 'culture', label_ar: 'الثقافة الإسلامية', label_ru: 'Исламская культура' },
];

const LEVELS = [
  { key: 'all', label_ar: 'جميع المستويات', label_ru: 'Все уровни' },
  { key: 'beginner', label_ar: 'مبتدئ', label_ru: 'Начинающий' },
  { key: 'intermediate', label_ar: 'متوسط', label_ru: 'Средний' },
  { key: 'advanced', label_ar: 'متقدم', label_ru: 'Продвинутый' },
];

const CATEGORY_EMOJIS: Record<string, string> = { quranStudies: '📖', arabic: '✍️', history: '🕌', culture: '🌍', fiqh: '⚖️', aqeedah: '🌙', general: '📚' };

export default function CoursesClient() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sort, setSort] = useState('popular');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { category, level, search: debouncedSearch, priceFilter, sort }],
    queryFn: () => coursesApi.getAll({
      ...(category !== 'all' && { category }),
      ...(level !== 'all' && { level }),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(priceFilter === 'free' && { free: 'true' }),
      sort,
      limit: 24,
    }),
    staleTime: 60_000,
  });

  const courses: Course[] = (data as { courses?: Course[] })?.courses || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-16 geometric-bg">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white arabic-text mb-4">{t('courses.title')}</h1>
            <p className="text-gray-400 arabic-text max-w-2xl mx-auto">
              {locale === 'ar' ? 'اكتشف مئات الدورات الإسلامية المتخصصة' : locale === 'ru' ? 'Откройте для себя сотни специализированных исламских курсов' : 'Discover hundreds of specialized Islamic courses'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search')} className="input-field pr-10 arabic-text" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'free', 'paid'] as const).map(p => (
              <button key={p} onClick={() => setPriceFilter(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all arabic-text ${priceFilter === p ? 'bg-primary-600 text-white' : 'bg-card border border-border hover:bg-muted'}`}>
                {p === 'all' ? (locale === 'ar' ? 'الكل' : 'All') : p === 'free' ? (locale === 'ar' ? 'مجاني' : 'Free') : (locale === 'ar' ? 'مدفوع' : 'Paid')}
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)} className="input-field !py-2 !px-3 text-sm w-auto arabic-text">
              <option value="popular">{locale === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}</option>
              <option value="rating">{locale === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
            </select>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all arabic-text ${category === cat.key ? 'bg-islamic-green text-white shadow-lg' : 'bg-card border border-border hover:bg-muted'}`}>
              {locale === 'ar' ? cat.label_ar : cat.label_ru}
            </button>
          ))}
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {LEVELS.map(lv => (
            <button key={lv.key} onClick={() => setLevel(lv.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all arabic-text ${level === lv.key ? 'bg-gold-500 text-white' : 'bg-card border border-border hover:bg-muted text-muted-foreground'}`}>
              {locale === 'ar' ? lv.label_ar : lv.label_ru}
            </button>
          ))}
        </div>

        {/* Results */}
        <p className="text-muted-foreground text-sm arabic-text mb-6 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {isLoading ? '...' : `${courses.length} ${locale === 'ar' ? 'دورة' : locale === 'ru' ? 'курсов' : 'courses'}`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-8 h-8" />}
            title={locale === 'ar' ? 'لا توجد دورات مطابقة' : 'No courses found'}
            description={locale === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing search criteria'} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/courses/${course.id}`}
                  className="block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
                  <div className="h-44 bg-gradient-to-br from-islamic-green/80 to-primary-700 flex items-center justify-center relative overflow-hidden">
                    <span className="text-7xl">{CATEGORY_EMOJIS[course.category] || '📚'}</span>
                    <div className="absolute inset-0 geometric-bg opacity-20" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className="badge bg-white/20 text-white backdrop-blur-sm text-xs arabic-text">{course.level}</span>
                      {course.price === 0 && <span className="badge bg-green-500 text-white text-xs arabic-text">{t('courses.free')}</span>}
                    </div>
                    {course.certificateEnabled && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Award className="w-3 h-3 text-gold-400" />
                        <span className="text-white text-xs arabic-text">{t('courses.certificate')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className={`badge text-xs mb-2 ${CATEGORY_COLORS[course.category] || CATEGORY_COLORS.general}`}>{course.category}</span>
                    <h3 className="font-bold text-foreground arabic-text mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors text-sm">
                      {course.titleAr || course.title}
                    </h3>
                    <p className="text-muted-foreground text-xs arabic-text mb-3">{course.instructorName}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /><span className="font-medium text-foreground">{course.rating}</span></div>
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{formatNumber(course.totalStudents)}</span></div>
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span>{course.durationHours}h</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className={`font-bold text-sm ${course.price === 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {course.price === 0 ? t('courses.free') : `$${course.price}`}
                      </span>
                      <span className="text-xs text-primary-600 font-medium arabic-text group-hover:underline">{t('courses.enroll')}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
