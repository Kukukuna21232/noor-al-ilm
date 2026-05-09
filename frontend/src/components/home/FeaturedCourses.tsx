'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Users, Clock, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { coursesApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import type { Course } from '@/types';

const FALLBACK_COURSES: Course[] = [
  { id: '1', title: 'أحكام التجويد للمبتدئين', titleAr: 'أحكام التجويد للمبتدئين', category: 'quranStudies', level: 'beginner', language: 'ar', price: 0, currency: 'USD', totalStudents: 1240, rating: 4.9, totalRatings: 320, totalLessons: 24, durationHours: 24, instructorName: 'الشيخ أحمد محمد', isPublished: true, isFeatured: true, certificateEnabled: true, tags: [], createdAt: '' },
  { id: '2', title: 'اللغة العربية من الصفر', titleAr: 'اللغة العربية من الصفر', category: 'arabic', level: 'beginner', language: 'ar', price: 0, currency: 'USD', totalStudents: 890, rating: 4.8, totalRatings: 210, totalLessons: 36, durationHours: 36, instructorName: 'د. فاطمة الزهراء', isPublished: true, isFeatured: true, certificateEnabled: true, tags: [], createdAt: '' },
  { id: '3', title: 'التاريخ الإسلامي الشامل', titleAr: 'التاريخ الإسلامي الشامل', category: 'history', level: 'intermediate', language: 'ar', price: 49, currency: 'USD', totalStudents: 650, rating: 4.7, totalRatings: 180, totalLessons: 48, durationHours: 48, instructorName: 'د. عمر الفاروق', isPublished: true, isFeatured: true, certificateEnabled: true, tags: [], createdAt: '' },
  { id: '4', title: 'حفظ القرآن الكريم', titleAr: 'حفظ القرآن الكريم', category: 'quranStudies', level: 'all', language: 'ar', price: 0, currency: 'USD', totalStudents: 2100, rating: 5.0, totalRatings: 540, totalLessons: 60, durationHours: 120, instructorName: 'الشيخ يوسف الحسن', isPublished: true, isFeatured: true, certificateEnabled: true, tags: [], createdAt: '' },
];

const CATEGORY_EMOJIS: Record<string, string> = { quranStudies: '📖', arabic: '✍️', history: '🕌', culture: '🌍', fiqh: '⚖️', aqeedah: '🌙' };

export default function FeaturedCourses() {
  const { t, dir, locale } = useI18n();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const { data } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => coursesApi.getAll({ featured: 'true', limit: '4' }),
    staleTime: 5 * 60_000,
  });

  const courses: Course[] = (data as { courses?: Course[] })?.courses || FALLBACK_COURSES;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex items-center justify-between mb-12">
          <div>
            <h2 className="section-title mb-2">{t('courses.title')}</h2>
            <p className="text-muted-foreground arabic-text">
              {locale === 'ar' ? 'أفضل الدورات المختارة لك' : locale === 'ru' ? 'Лучшие курсы для вас' : 'Best courses selected for you'}
            </p>
          </div>
          <Link href="/courses" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors arabic-text">
            {t('common.viewAll')} <ArrowIcon className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.slice(0, 4).map((course, i) => (
            <motion.div key={course.id}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}>
              <Link href={`/courses/${course.id}`}
                className="block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
                {/* Thumbnail */}
                <div className="h-44 bg-gradient-to-br from-islamic-green/80 to-primary-700 flex items-center justify-center relative overflow-hidden">
                  <span className="text-7xl">{CATEGORY_EMOJIS[course.category] || '📚'}</span>
                  <div className="absolute inset-0 geometric-bg opacity-20" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="badge bg-white/20 text-white backdrop-blur-sm text-xs">{course.level}</span>
                    {course.price === 0 && <span className="badge bg-green-500 text-white text-xs arabic-text">{t('courses.free')}</span>}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <span className="badge badge-primary text-xs mb-2">{course.category}</span>
                  <h3 className="font-bold text-foreground arabic-text mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors text-sm">
                    {course.titleAr || course.title}
                  </h3>
                  <p className="text-muted-foreground text-xs arabic-text mb-3">{course.instructorName}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
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
      </div>
    </section>
  );
}
