'use client';
import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, Globe, Video, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useIntersectionObserver, useCountUp } from '@/hooks';

const STATS = [
  { key: 'students',  value: 50000,  suffix: '+', icon: Users,         color: 'from-green-500 to-emerald-600',  label_ar: 'طالب نشط',       label_ru: 'студентов',    label_en: 'Active Students' },
  { key: 'courses',   value: 500,    suffix: '+', icon: BookOpen,       color: 'from-blue-500 to-cyan-600',      label_ar: 'دورة متاحة',     label_ru: 'курсов',       label_en: 'Courses' },
  { key: 'teachers',  value: 120,    suffix: '+', icon: GraduationCap,  color: 'from-gold-500 to-amber-600',     label_ar: 'معلم متخصص',     label_ru: 'преподавателей', label_en: 'Specialists' },
  { key: 'countries', value: 80,     suffix: '+', icon: Globe,          color: 'from-purple-500 to-violet-600',  label_ar: 'دولة',           label_ru: 'стран',        label_en: 'Countries' },
  { key: 'videos',    value: 2000,   suffix: '+', icon: Video,          color: 'from-red-500 to-rose-600',       label_ar: 'فيديو تعليمي',   label_ru: 'видео',        label_en: 'Videos' },
  { key: 'questions', value: 100000, suffix: '+', icon: MessageCircle,  color: 'from-teal-500 to-cyan-600',      label_ar: 'سؤال أُجيب عنه', label_ru: 'ответов',      label_en: 'Questions Answered' },
];

function StatCard({ stat, index, start }: { stat: typeof STATS[0]; index: number; start: boolean }) {
  const { locale } = useI18n();
  const count = useCountUp(stat.value, 2000, start);
  const Icon = stat.icon;
  const label = locale === 'ar' ? stat.label_ar : locale === 'ru' ? stat.label_ru : stat.label_en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
    >
      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">
        {count.toLocaleString()}{stat.suffix}
      </p>
      <p className="text-sm text-muted-foreground arabic-text">{label}</p>
    </motion.div>
  );
}

export default function StatsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-16 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.key} stat={stat} index={i} start={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
