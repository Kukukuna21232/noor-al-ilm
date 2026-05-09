'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Sparkles, ArrowLeft, ArrowRight, MessageCircle, BookOpen, Clock, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const SAMPLE_MESSAGES = [
  { role: 'user', text_ar: 'ما هي أركان الإسلام الخمسة؟', text_ru: 'Каковы пять столпов ислама?' },
  { role: 'assistant', text_ar: 'أركان الإسلام الخمسة هي:\n١. الشهادتان\n٢. إقامة الصلاة\n٣. إيتاء الزكاة\n٤. صوم رمضان\n٥. حج البيت\n\nقال النبي ﷺ: «بُنِيَ الإسلامُ على خمسٍ» [متفق عليه]', text_ru: 'Пять столпов ислама:\n١. Шахада\n٢. Намаз\n٣. Закят\n٤. Пост в Рамадан\n٥. Хадж\n\nПророк ﷺ сказал: «Ислам построен на пяти» [Бухари, Муслим]' },
];

const CATEGORIES = [
  { icon: BookOpen, label_ar: 'القرآن', label_ru: 'Коран', color: 'text-green-500' },
  { icon: MessageCircle, label_ar: 'الفقه', label_ru: 'Фикх', color: 'text-blue-500' },
  { icon: Clock, label_ar: 'الصلاة', label_ru: 'Намаз', color: 'text-gold-500' },
  { icon: Globe, label_ar: 'التاريخ', label_ru: 'История', color: 'text-purple-500' },
];

export default function AIImamPreview() {
  const { t, dir, locale } = useI18n();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Text side */}
          <motion.div initial={{ opacity: 0, x: dir === 'rtl' ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className={dir === 'rtl' ? 'text-right' : 'text-left'}>
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full px-4 py-1.5 text-sm mb-5">
              <Sparkles className="w-4 h-4" />
              <span className="arabic-text">{locale === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : locale === 'ru' ? 'На основе ИИ' : 'AI-Powered'}</span>
            </div>
            <h2 className="section-title mb-4">{t('askImam.title')}</h2>
            <p className="text-muted-foreground arabic-text text-base leading-relaxed mb-6">
              {t('askImam.subtitle')}
            </p>
            <p className="text-muted-foreground arabic-text text-sm leading-relaxed mb-8">
              {locale === 'ar'
                ? 'يجيب على أسئلتك الإسلامية بدقة واحترافية، مع الاستشهاد بالقرآن الكريم والسنة النبوية. يدعم العربية والروسية والإنجليزية.'
                : locale === 'ru'
                ? 'Отвечает на ваши исламские вопросы точно и профессионально, цитируя Коран и Сунну. Поддерживает арабский, русский и английский языки.'
                : 'Answers your Islamic questions accurately with Quran and Hadith citations. Supports Arabic, Russian, and English.'}
            </p>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 mb-8">
              {CATEGORIES.map(({ icon: Icon, label_ar, label_ru, color }) => (
                <div key={label_ar} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="arabic-text">{locale === 'ar' ? label_ar : label_ru}</span>
                </div>
              ))}
            </div>

            <Link href="/ask-imam" className="btn-primary text-base px-8 py-4">
              <Bot className="w-5 h-5" />
              <span className="arabic-text">{t('askImam.title')}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Chat preview */}
          <motion.div initial={{ opacity: 0, x: dir === 'rtl' ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-islamic-dark to-islamic-navy p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm arabic-text">{t('askImam.title')}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-gray-400 text-xs">{locale === 'ar' ? 'متصل' : locale === 'ru' ? 'Онлайн' : 'Online'}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-4 min-h-[280px] bg-muted/20">
              {SAMPLE_MESSAGES.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-gradient-to-br from-islamic-green to-primary-600' : 'bg-gradient-to-br from-gold-500 to-gold-600'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <span className="text-white text-xs font-bold">أ</span>}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm arabic-text leading-relaxed whitespace-pre-line ${msg.role === 'assistant' ? 'bg-card border border-border rounded-tl-sm' : 'bg-primary-600 text-white rounded-tr-sm'}`}>
                    {locale === 'ar' ? msg.text_ar : msg.text_ru}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input preview */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2 items-center bg-muted rounded-xl px-4 py-3">
                <span className="text-muted-foreground text-sm arabic-text flex-1">{t('askImam.placeholder')}</span>
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <ArrowIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground arabic-text mt-2 text-center">{t('askImam.disclaimer')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
