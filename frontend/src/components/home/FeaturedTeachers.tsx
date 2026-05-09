'use client';
import { motion } from 'framer-motion';
import { Star, BookOpen, Users, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const TEACHERS = [
  { name: 'الشيخ أحمد محمد', nameRu: 'Шейх Ахмад Мухаммад', specialty_ar: 'علوم القرآن والتجويد', specialty_ru: 'Коранические науки', courses: 12, rating: 4.9, students: 3400, avatar: 'أ', verified: true },
  { name: 'د. فاطمة الزهراء', nameRu: 'Д-р Фатима аз-Захра', specialty_ar: 'اللغة العربية', specialty_ru: 'Арабский язык', courses: 8, rating: 4.8, students: 2100, avatar: 'ف', verified: true },
  { name: 'د. عمر الفاروق', nameRu: 'Д-р Умар аль-Фарук', specialty_ar: 'التاريخ الإسلامي', specialty_ru: 'История ислама', courses: 6, rating: 4.7, students: 1800, avatar: 'ع', verified: true },
  { name: 'الشيخ يوسف الحسن', nameRu: 'Шейх Юсуф аль-Хасан', specialty_ar: 'الفقه الإسلامي', specialty_ru: 'Исламское право', courses: 10, rating: 5.0, students: 4200, avatar: 'ي', verified: true },
];

export default function FeaturedTeachers() {
  const { locale } = useI18n();

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="section-title mb-3">
            {locale === 'ar' ? 'معلمونا المتميزون' : locale === 'ru' ? 'Наши выдающиеся преподаватели' : 'Our Distinguished Teachers'}
          </h2>
          <p className="text-muted-foreground arabic-text">
            {locale === 'ar' ? 'نخبة من أفضل العلماء والمعلمين المتخصصين' : 'The best scholars and specialized teachers'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEACHERS.map((teacher, i) => (
            <motion.div key={teacher.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {teacher.avatar}
                </div>
                {teacher.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-foreground arabic-text mb-1">{locale === 'ar' ? teacher.name : teacher.nameRu}</h3>
              <p className="text-muted-foreground text-xs arabic-text mb-3">{locale === 'ar' ? teacher.specialty_ar : teacher.specialty_ru}</p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" /><span className="font-medium text-foreground">{teacher.rating}</span></div>
                <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /><span>{teacher.courses}</span></div>
                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{(teacher.students / 1000).toFixed(1)}K</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
