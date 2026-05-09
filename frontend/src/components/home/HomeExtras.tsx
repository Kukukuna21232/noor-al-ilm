'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Eye, ArrowLeft, ArrowRight, Star, Quote, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// ── LatestDiscussions ─────────────────────────────────────
const DISCUSSIONS = [
  { id: '1', title: 'ما هي أفضل طريقة لحفظ القرآن الكريم؟', category: 'القرآن', replies: 24, likes: 87, views: 342, author: 'أبو عبدالله', time: 'منذ ساعتين', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { id: '2', title: 'كيف أتعلم اللغة العربية بسرعة وفعالية؟', category: 'العربية', replies: 18, likes: 65, views: 289, author: 'أم محمد', time: 'منذ 3 ساعات', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: '3', title: 'فضل قراءة سورة الكهف يوم الجمعة', category: 'الفقه', replies: 31, likes: 120, views: 567, author: 'عبدالرحمن', time: 'منذ 5 ساعات', color: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400' },
  { id: '4', title: 'نصائح للمبتدئين في تعلم أحكام التجويد', category: 'التجويد', replies: 15, likes: 43, views: 198, author: 'نور الهدى', time: 'منذ يوم', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

export function LatestDiscussions() {
  const { t, dir } = useI18n();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex items-center justify-between mb-12">
          <div>
            <h2 className="section-title mb-2">{t('forum.title')}</h2>
            <p className="text-muted-foreground arabic-text">انضم إلى النقاشات العلمية</p>
          </div>
          <Link href="/forum" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors arabic-text">
            {t('common.viewAll')} <ArrowIcon className="w-4 h-4" />
          </Link>
        </motion.div>
        <div className="space-y-3">
          {DISCUSSIONS.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link href={`/forum/${post.id}`} className="block bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary-300 transition-all duration-300 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`badge text-xs ${post.color}`}>{post.category}</span>
                      <span className="text-muted-foreground text-xs">{post.time}</span>
                    </div>
                    <h3 className="font-bold text-foreground arabic-text group-hover:text-primary-600 transition-colors line-clamp-1">{post.title}</h3>
                    <p className="text-muted-foreground text-xs arabic-text mt-1">بقلم: {post.author}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /><span>{post.replies}</span></div>
                    <div className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /><span>{post.likes}</span></div>
                    <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /><span>{post.views}</span></div>
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

// ── IslamicCalendar ───────────────────────────────────────
const EVENTS = [
  { name_ar: 'رمضان المبارك', name_ru: 'Рамадан', month: 9, day: 1, emoji: '🌙' },
  { name_ar: 'عيد الفطر', name_ru: 'Ид аль-Фитр', month: 10, day: 1, emoji: '🎉' },
  { name_ar: 'عيد الأضحى', name_ru: 'Ид аль-Адха', month: 12, day: 10, emoji: '🐑' },
  { name_ar: 'المولد النبوي', name_ru: 'День рождения Пророка', month: 3, day: 12, emoji: '⭐' },
  { name_ar: 'ليلة القدر', name_ru: 'Ночь Предопределения', month: 9, day: 27, emoji: '✨' },
  { name_ar: 'يوم عرفة', name_ru: 'День Арафа', month: 12, day: 9, emoji: '🕌' },
];

export function IslamicCalendar() {
  const { locale } = useI18n();
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="section-title">{locale === 'ar' ? 'التقويم الإسلامي' : locale === 'ru' ? 'Исламский календарь' : 'Islamic Calendar'}</h2>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {EVENTS.map((event, i) => (
            <motion.div key={event.name_ar} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-4 text-center hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <span className="text-3xl block mb-2">{event.emoji}</span>
              <p className="text-sm font-bold text-foreground arabic-text">{locale === 'ar' ? event.name_ar : event.name_ru}</p>
              <p className="text-xs text-muted-foreground mt-1">{locale === 'ar' ? `${event.day}/${event.month} هـ` : `${event.day}/${event.month} хиджры`}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TestimonialsSection ───────────────────────────────────
const TESTIMONIALS = [
  { name: 'محمد الرشيد', nameRu: 'Мухаммад ар-Рашид', country_ar: 'روسيا', country_ru: 'Россия', text_ar: 'منصة رائعة ساعدتني على تعلم القرآن وأنا في روسيا. المعلمون متميزون والمحتوى ممتاز.', text_ru: 'Отличная платформа, которая помогла мне изучить Коран в России. Преподаватели превосходны.', rating: 5, avatar: 'م' },
  { name: 'Айгуль Бекова', nameRu: 'Айгуль Бекова', country_ar: 'كازاخستان', country_ru: 'Казахстан', text_ar: 'منصة ممتازة لتعلم الإسلام. واجهة مريحة ودروس عالية الجودة.', text_ru: 'Отличная платформа для изучения ислама. Удобный интерфейс и качественные уроки.', rating: 5, avatar: 'А' },
  { name: 'عبدالله الأنصاري', nameRu: 'Абдулла аль-Ансари', country_ar: 'مصر', country_ru: 'Египет', text_ar: 'تعلمت التجويد من الصفر حتى أصبحت أقرأ القرآن بشكل صحيح. شكراً لنور العلم.', text_ru: 'Я выучил таджвид с нуля и теперь читаю Коран правильно. Спасибо Нур аль-Ильм.', rating: 5, avatar: 'ع' },
];

export function TestimonialsSection() {
  const { locale } = useI18n();
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="section-title mb-3">{locale === 'ar' ? 'ماذا يقول طلابنا' : locale === 'ru' ? 'Отзывы наших студентов' : 'What Our Students Say'}</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 relative">
              <Quote className="w-8 h-8 text-primary-200 dark:text-primary-800 absolute top-4 right-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold text-lg">{t.avatar}</div>
                <div>
                  <p className="font-bold text-foreground">{locale === 'ar' ? t.name : t.nameRu}</p>
                  <p className="text-muted-foreground text-xs">{locale === 'ar' ? t.country_ar : t.country_ru}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-gold-500 fill-gold-500" />)}</div>
              <p className="text-muted-foreground text-sm leading-relaxed arabic-text">{locale === 'ar' ? t.text_ar : t.text_ru}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTASection ────────────────────────────────────────────
export function CTASection() {
  const { t, locale } = useI18n();
  return (
    <section className="py-24 bg-gradient-to-br from-islamic-green via-primary-700 to-islamic-teal relative overflow-hidden">
      <div className="absolute inset-0 geometric-bg opacity-10" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-gold-300 text-xl arabic-text mb-3 font-bold">{t('home.cta.subtitle')}</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white arabic-text mb-4">{t('home.cta.title')}</h2>
          <p className="text-white/80 text-lg arabic-text mb-8 max-w-2xl mx-auto">
            {locale === 'ar' ? 'ابدأ رحلتك التعليمية الإسلامية اليوم مجاناً وانضم إلى أكثر من ٥٠,٠٠٠ طالب' : locale === 'ru' ? 'Начните своё исламское образование сегодня бесплатно и присоединитесь к более чем 50 000 студентов' : 'Start your Islamic educational journey today for free and join over 50,000 students'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register" className="btn-gold text-base px-8 py-4 arabic-text">{t('home.cta.btn')}</Link>
            <Link href="/courses" className="px-8 py-4 rounded-xl border-2 border-white/40 text-white hover:bg-white/10 transition-all font-semibold text-base arabic-text">
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LatestDiscussions;
