'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Bookmark, Share2, Flag, Bell, Eye, Clock, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { videoApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

// Inline lightweight video player (no external HLS dependency needed for SSR)
function SimplePlayer({ thumbnailUrl, title }: { thumbnailUrl?: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer"
      onClick={() => setPlaying(!playing)}>
      {thumbnailUrl
        ? <img src={thumbnailUrl} alt={title || ''} className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-gradient-to-br from-islamic-dark to-islamic-navy flex items-center justify-center geometric-bg">
            <span className="text-8xl">🎬</span>
          </div>
      }
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className={`w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl transition-transform ${playing ? 'scale-90' : 'group-hover:scale-110'}`}>
          {playing
            ? <span className="flex gap-2"><span className="w-3 h-8 bg-islamic-dark rounded-sm" /><span className="w-3 h-8 bg-islamic-dark rounded-sm" /></span>
            : <svg className="w-8 h-8 text-islamic-dark ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          }
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm font-medium arabic-text truncate">{title}</p>
        </div>
      )}
    </div>
  );
}

const RELATED = [
  { id: '2', title_ar: 'شرح سورة الفاتحة', channel: 'الشيخ أحمد', views: 8400, duration: '18:30', thumb: '📖' },
  { id: '3', title_ar: 'أحكام التجويد — الدرس الثاني', channel: 'نور العلم', views: 5200, duration: '22:15', thumb: '🎓' },
  { id: '4', title_ar: 'قصة سيدنا موسى عليه السلام', channel: 'تاريخ الإسلام', views: 12000, duration: '35:00', thumb: '🕌' },
  { id: '5', title_ar: 'تعلم الحروف العربية', channel: 'تعلم العربية', views: 15600, duration: '14:45', thumb: '✍️' },
  { id: '6', title_ar: 'فضل الصلاة على النبي ﷺ', channel: 'نور الهدى', views: 21000, duration: '12:00', thumb: '⭐' },
];

export function generateStaticParams() {
  return ['1', '2', '3', '4', '5', '6'].map((id) => ({ id }));
}

export default function WatchPage() {
  const params = useParams();
  const id = params.id as string;
  const { locale } = useI18n();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [descExpanded, setDescExpanded] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  // Try to fetch real video, fall back to mock
  const { data } = useQuery({
    queryKey: ['video', id],
    queryFn: () => videoApi.getById(id),
    retry: false,
  });

  const video = (data as { video?: Record<string, unknown> })?.video || {
    id,
    title_ar: 'مقدمة في أحكام التجويد',
    title_ru: 'Введение в правила таджвида',
    description_ar: 'في هذا الفيديو التعليمي نتعلم أحكام التجويد الأساسية للمبتدئين، مع أمثلة تطبيقية من القرآن الكريم.',
    description_ru: 'В этом образовательном видео мы изучаем основные правила таджвида для начинающих с практическими примерами из Корана.',
    view_count: 12400,
    like_count: 843,
    comment_count: 67,
    duration_seconds: 1245,
    channel_name: 'الشيخ أحمد محمد',
    creator_verified: true,
    subscriber_count: 34000,
    category: 'quranStudies',
    ai_generated: false,
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const v = video as Record<string, unknown>;
  const title = (locale === 'ar' ? v.title_ar : v.title_ru) as string || v.title as string || '';
  const description = (locale === 'ar' ? v.description_ar : v.description_ru) as string || '';

  const handleLike = (isLike: boolean) => {
    if (!user) { toast.error(t('يجب تسجيل الدخول', 'Необходимо войти')); return; }
    setLiked(liked === isLike ? null : isLike);
    toast.success(isLike ? t('تم الإعجاب', 'Понравилось') : t('تم التصويت', 'Оценено'));
  };

  const handleBookmark = () => {
    if (!user) { toast.error(t('يجب تسجيل الدخول', 'Необходимо войти')); return; }
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? t('تم الإلغاء', 'Удалено из сохранённых') : t('تم الحفظ', 'Сохранено'));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('تم نسخ الرابط', 'Ссылка скопирована'));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Main */}
            <div className="xl:col-span-2 space-y-4">
              {/* Player */}
              <SimplePlayer thumbnailUrl={v.thumbnail_url as string} title={title} />

              {/* Title & meta */}
              <div className="space-y-3">
                <h1 className="text-xl md:text-2xl font-bold text-foreground arabic-text leading-tight">{title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{formatNumber(v.view_count as number)} {t('مشاهدة', 'просмотров')}</span></div>
                  <span>·</span>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{t('منذ 3 أيام', '3 дня назад')}</span></div>
                  <span className="badge badge-primary text-xs arabic-text">{v.category as string}</span>
                  {v.ai_generated && <span className="badge bg-purple-100 text-purple-700 text-xs">🤖 AI</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center rounded-xl overflow-hidden border border-border">
                    <button onClick={() => handleLike(true)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${liked === true ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' : ''}`}>
                      <ThumbsUp className="w-4 h-4" />
                      <span>{formatNumber(v.like_count as number)}</span>
                    </button>
                    <div className="w-px h-6 bg-border" />
                    <button onClick={() => handleLike(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${liked === false ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : ''}`}>
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted ${bookmarked ? 'text-gold-600 border-gold-300' : ''}`}>
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-gold-500' : ''}`} />
                    <span className="arabic-text">{t('حفظ', 'Сохранить')}</span>
                  </button>
                  <button onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted">
                    <Share2 className="w-4 h-4" />
                    <span className="arabic-text">{t('مشاركة', 'Поделиться')}</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors mr-auto">
                    <Flag className="w-4 h-4" />
                    <span className="arabic-text">{t('إبلاغ', 'Пожаловаться')}</span>
                  </button>
                </div>
              </div>

              {/* Channel */}
              <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {(v.channel_name as string)?.charAt(0) || 'ن'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground arabic-text">{v.channel_name as string}</p>
                      {v.creator_verified && <CheckCircle className="w-4 h-4 text-primary-500" />}
                    </div>
                    <p className="text-muted-foreground text-xs arabic-text">
                      {formatNumber(v.subscriber_count as number)} {t('مشترك', 'подписчиков')}
                    </p>
                  </div>
                </div>
                {user && (
                  <button className="btn-primary !px-5 !py-2 !text-sm arabic-text">
                    <Bell className="w-4 h-4" />{t('اشتراك', 'Подписаться')}
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className={`text-sm text-muted-foreground arabic-text leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                  {description || t('لا يوجد وصف', 'Описание отсутствует')}
                </div>
                {description.length > 150 && (
                  <button onClick={() => setDescExpanded(!descExpanded)}
                    className="flex items-center gap-1 text-primary-600 text-sm font-medium mt-2 hover:underline arabic-text">
                    {descExpanded ? <><ChevronUp className="w-4 h-4" />{t('عرض أقل', 'Свернуть')}</> : <><ChevronDown className="w-4 h-4" />{t('عرض المزيد', 'Показать больше')}</>}
                  </button>
                )}
              </div>

              {/* Comments placeholder */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground arabic-text mb-4">
                  {t('التعليقات', 'Комментарии')} ({formatNumber(v.comment_count as number)})
                </h3>
                {user ? (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {user.name?.charAt(0)}
                    </div>
                    <input placeholder={t('أضف تعليقاً...', 'Добавить комментарий...')}
                      className="input-field flex-1 arabic-text text-sm" />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm arabic-text text-center py-4">
                    <Link href="/auth/login" className="text-primary-600 hover:underline">{t('سجّل الدخول', 'Войдите')}</Link>
                    {' '}{t('للمشاركة في النقاش', 'для участия в обсуждении')}
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-3">
              <h3 className="font-bold text-foreground arabic-text">{t('فيديوهات ذات صلة', 'Похожие видео')}</h3>
              {RELATED.map((rv, i) => (
                <motion.div key={rv.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/watch/${rv.id}`} className="flex gap-3 group hover:bg-muted/50 rounded-xl p-2 transition-colors">
                    <div className="relative w-40 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-islamic-green/40 to-primary-700/40 flex items-center justify-center shrink-0">
                      <span className="text-3xl">{rv.thumb}</span>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">{rv.duration}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-sm font-medium text-foreground arabic-text line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{rv.title_ar}</h4>
                      <p className="text-xs text-muted-foreground arabic-text mt-1">{rv.channel}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" /><span>{formatNumber(rv.views)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
