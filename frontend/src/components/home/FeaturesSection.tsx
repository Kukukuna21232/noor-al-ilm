'use client';
import { motion } from 'framer-motion';
import { BookOpen, MessageCircle, Users, Languages, Award, Shield, Video, Radio, Mic, Brain } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useIntersectionObserver } from '@/hooks';

const FEATURES = [
  { icon: BookOpen,      color: 'bg-green-500/10 text-green-600 dark:text-green-400',   border: 'border-green-500/20',   key: 'quran' },
  { icon: Brain,         color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',      border: 'border-blue-500/20',    key: 'ai' },
  { icon: Users,         color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', key: 'community' },
  { icon: Video,         color: 'bg-red-500/10 text-red-600 dark:text-red-400',         border: 'border-red-500/20',     key: 'video' },
  { icon: Radio,         color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', key: 'live' },
  { icon: Languages,     color: 'bg-gold-500/10 text-gold-600 dark:text-gold-400',      border: 'border-gold-500/20',    key: 'multilingual' },
  { icon: Award,         color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',      border: 'border-teal-500/20',    key: 'certified' },
  { icon: Shield,        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', key: 'secure' },
  { icon: Mic,           color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',      border: 'border-pink-500/20',    key: 'voice' },
];

const EXTRA_FEATURES: Record<string, { title_ar: string; desc_ar: string; title_ru: string; desc_ru: string }> = {
  certified: { title_ar: 'شهادات معتمدة', desc_ar: 'احصل على شهادات معتمدة عند إتمام الدورات', title_ru: 'Сертификаты', desc_ru: 'Получайте сертификаты по завершении курсов' },
  secure:    { title_ar: 'بيئة آمنة', desc_ar: 'منصة آمنة ومحمية بأحدث تقنيات الأمان', title_ru: 'Безопасность', desc_ru: 'Защищённая платформа с современными технологиями' },
  voice:     { title_ar: 'دعم صوتي', desc_ar: 'تفاعل مع الإمام الذكي بالصوت', title_ru: 'Голосовой ввод', desc_ru: 'Взаимодействуйте с ИИ-Имамом голосом' },
};

export default function FeaturesSection() {
  const { t, locale } = useI18n();
  const { ref, isVisible } = useIntersectionObserver();

  const getFeatureText = (key: string) => {
    const extra = EXTRA_FEATURES[key];
    if (extra) {
      return {
        title: locale === 'ar' ? extra.title_ar : locale === 'ru' ? extra.title_ru : extra.title_ar,
        desc: locale === 'ar' ? extra.desc_ar : locale === 'ru' ? extra.desc_ru : extra.desc_ar,
      };
    }
    return { title: t(`home.features.${key}.title`), desc: t(`home.features.${key}.desc`) };
  };

  return (
    <section className="py-20 bg-muted/30" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="text-center mb-14">
          <h2 className="section-title mb-4">{t('home.features.title')}</h2>
          <p className="section-subtitle mx-auto arabic-text">
            {locale === 'ar' ? 'نقدم لك تجربة تعليمية إسلامية متكاملة تجمع بين الأصالة والحداثة'
              : locale === 'ru' ? 'Мы предлагаем комплексный исламский образовательный опыт'
              : 'We offer a comprehensive Islamic educational experience'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, color, border, key }, i) => {
            const { title, desc } = getFeatureText(key);
            return (
              <motion.div key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`bg-card border ${border} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2 arabic-text">{title}</h3>
                <p className="text-muted-foreground text-sm arabic-text leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
