'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Users, Eye, Clock, Send, MessageCircle, Calendar, Bell } from 'lucide-react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';

const LIVE_STREAMS = [
  { id: '1', title_ar: 'درس مباشر: تفسير سورة البقرة', title_ru: 'Прямой урок: Тафсир суры Аль-Бакара', host_ar: 'الشيخ أحمد محمد', host_ru: 'Шейх Ахмад Мухаммад', viewers: 1240, category_ar: 'تفسير', category_ru: 'Тафсир', started: '45 دقيقة', thumb: '📖', live: true },
  { id: '2', title_ar: 'محاضرة: السيرة النبوية الشريفة', title_ru: 'Лекция: Жизнеописание Пророка ﷺ', host_ar: 'د. عمر الفاروق', host_ru: 'Д-р Умар аль-Фарук', viewers: 876, category_ar: 'سيرة', category_ru: 'Сира', started: '1:20 ساعة', thumb: '⭐', live: true },
  { id: '3', title_ar: 'دروس اللغة العربية للمبتدئين', title_ru: 'Уроки арабского языка для начинающих', host_ar: 'د. فاطمة الزهراء', host_ru: 'Д-р Фатима аз-Захра', viewers: 543, category_ar: 'عربية', category_ru: 'Арабский', started: '20 دقيقة', thumb: '✍️', live: true },
];

const UPCOMING = [
  { id: '4', title_ar: 'شرح الأربعين النووية', title_ru: 'Объяснение сорока хадисов', host_ar: 'الشيخ يوسف الحسن', host_ru: 'Шейх Юсуф аль-Хасан', scheduled: '2026-05-10T18:00:00', thumb: '📚' },
  { id: '5', title_ar: 'أحكام الزكاة والصدقة', title_ru: 'Правила закята и садаки', host_ar: 'د. عبدالله الأنصاري', host_ru: 'Д-р Абдулла аль-Ансари', scheduled: '2026-05-11T20:00:00', thumb: '🌙' },
  { id: '6', title_ar: 'تعلم التجويد مع الشيخ', title_ru: 'Изучение таджвида с шейхом', host_ar: 'الشيخ أحمد محمد', host_ru: 'Шейх Ахмад Мухаммад', scheduled: '2026-05-12T17:00:00', thumb: '🎓' },
];

function LivePlayer({ stream }: { stream: typeof LIVE_STREAMS[0] }) {
  const { locale } = useI18n();
  const { user } = useAuthStore();
  const [chatMsg, setChatMsg] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: 'أبو عبدالله', msg: 'جزاك الله خيراً شيخنا', time: '14:32' },
    { id: '2', user: 'Айгуль', msg: 'Машааллах, очень полезно!', time: '14:33' },
    { id: '3', user: 'أم محمد', msg: 'بارك الله فيك', time: '14:34' },
  ]);

  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  const sendChat = () => {
    if (!chatMsg.trim() || !user) return;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), user: user.name, msg: chatMsg.trim(), time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) }]);
    setChatMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Video */}
      <div className="lg:col-span-2">
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-islamic-dark to-islamic-navy flex items-center justify-center geometric-bg">
            <span className="text-8xl">{stream.thumb}</span>
          </div>
          {/* Live badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
          {/* Viewer count */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(stream.viewers)}</span>
          </div>
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-bold arabic-text">{locale === 'ar' ? stream.title_ar : stream.title_ru}</p>
            <p className="text-gray-300 text-sm arabic-text">{locale === 'ar' ? stream.host_ar : stream.host_ru}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold">
              {(locale === 'ar' ? stream.host_ar : stream.host_ru).charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground arabic-text text-sm">{locale === 'ar' ? stream.host_ar : stream.host_ru}</p>
              <p className="text-muted-foreground text-xs arabic-text">{t('بدأ منذ', 'Начался')} {stream.started}</p>
            </div>
          </div>
          {user && <button className="btn-primary !px-4 !py-2 !text-sm arabic-text"><Bell className="w-4 h-4" />{t('تنبيه', 'Уведомить')}</button>}
        </div>
      </div>

      {/* Live chat */}
      <div className="bg-card border border-border rounded-2xl flex flex-col h-[400px] lg:h-auto">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-foreground arabic-text text-sm">{t('الدردشة المباشرة', 'Живой чат')}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {chatMessages.map(msg => (
            <div key={msg.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{msg.user.charAt(0)}</div>
              <div>
                <span className="text-xs font-bold text-primary-600 arabic-text">{msg.user} </span>
                <span className="text-xs text-foreground arabic-text">{msg.msg}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          {user ? (
            <div className="flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder={t('اكتب رسالة...', 'Написать сообщение...')}
                className="input-field flex-1 text-xs arabic-text !py-2" />
              <button onClick={sendChat} disabled={!chatMsg.trim()}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground arabic-text">
              <Link href="/auth/login" className="text-primary-600 hover:underline">{t('سجّل الدخول', 'Войдите')}</Link>
              {' '}{t('للمشاركة', 'для участия')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  const { locale } = useI18n();
  const [selectedStream, setSelectedStream] = useState(LIVE_STREAMS[0]);
  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-12 geometric-bg">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <h1 className="text-3xl md:text-5xl font-bold text-white arabic-text">{t('البث المباشر', 'Прямой эфир')}</h1>
              </div>
              <p className="text-gray-400 arabic-text">{t('دروس ومحاضرات إسلامية مباشرة', 'Прямые исламские уроки и лекции')}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="badge bg-red-500/20 text-red-300 border border-red-500/30 text-xs">{LIVE_STREAMS.length} {t('بث مباشر الآن', 'в эфире сейчас')}</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Featured live */}
          <section>
            <h2 className="font-bold text-foreground arabic-text text-xl mb-5">{t('البث المميز', 'Избранный эфир')}</h2>
            <LivePlayer stream={selectedStream} />
          </section>

          {/* All live streams */}
          <section>
            <h2 className="font-bold text-foreground arabic-text text-xl mb-5">{t('جميع البثوث المباشرة', 'Все прямые эфиры')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {LIVE_STREAMS.map((stream, i) => (
                <motion.div key={stream.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <button onClick={() => setSelectedStream(stream)} className={`w-full text-right bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ${selectedStream.id === stream.id ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-border'}`}>
                    <div className="relative h-36 bg-gradient-to-br from-islamic-dark to-islamic-navy flex items-center justify-center">
                      <span className="text-5xl">{stream.thumb}</span>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />LIVE
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                        <Eye className="w-3 h-3" />{formatNumber(stream.viewers)}
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="badge badge-primary text-xs arabic-text mb-2">{locale === 'ar' ? stream.category_ar : stream.category_ru}</span>
                      <h3 className="font-bold text-foreground arabic-text text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">{locale === 'ar' ? stream.title_ar : stream.title_ru}</h3>
                      <p className="text-muted-foreground text-xs arabic-text mt-1">{locale === 'ar' ? stream.host_ar : stream.host_ru}</p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Upcoming */}
          <section>
            <h2 className="font-bold text-foreground arabic-text text-xl mb-5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />{t('البثوث القادمة', 'Предстоящие эфиры')}
            </h2>
            <div className="space-y-3">
              {UPCOMING.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-islamic-green/30 to-primary-600/30 flex items-center justify-center text-3xl shrink-0">{item.thumb}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground arabic-text line-clamp-1">{locale === 'ar' ? item.title_ar : item.title_ru}</h3>
                    <p className="text-muted-foreground text-xs arabic-text">{locale === 'ar' ? item.host_ar : item.host_ru}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-primary-600 arabic-text">
                      {new Date(item.scheduled).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'ru-RU', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(item.scheduled).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg bg-muted hover:bg-primary-100 dark:hover:bg-primary-950/30 hover:text-primary-600 transition-colors text-muted-foreground shrink-0">
                    <Bell className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
