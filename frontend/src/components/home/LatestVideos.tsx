'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Clock, CheckCircle, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber, formatDuration } from '@/lib/utils';

const SAMPLE_VIDEOS = [
  { id: '1', titleAr: 'مقدمة في أحكام التجويد', durationSeconds: 1245, viewCount: 12400, thumbnailUrl: null, channelName: 'الشيخ أحمد', creatorVerified: true, category: 'quranStudies', aiGenerated: false },
  { id: '2', titleAr: 'قصة الإسلام في روسيا', durationSeconds: 2180, viewCount: 8900, thumbnailUrl: null, channelName: 'تاريخ الإسلام', creatorVerified: true, category: 'history', aiGenerated: true },
  { id: '3', titleAr: 'تعلم الحروف العربية', durationSeconds: 890, viewCount: 15600, thumbnailUrl: null, channelName: 'تعلم العربية', creatorVerified: false, category: 'arabic', aiGenerated: false },
  { id: '4', titleAr: 'فضل الصلاة في الإسلام', durationSeconds: 1560, viewCount: 21000, thumbnailUrl: null, channelName: 'نور الهدى', creatorVerified: true, category: 'fiqh', aiGenerated: false },
];

const CATEGORY_COLORS: Record<string, string> = {
  quranStudies: 'from-green-600 to-emerald-700',
  history: 'from-purple-600 to-violet-700',
  arabic: 'from-blue-600 to-cyan-700',
  fiqh: 'from-gold-600 to-amber-700',
};

export default function LatestVideos() {
  const { t, dir, locale } = useI18n();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex items-center justify-between mb-12">
          <div>
            <h2 className="section-title mb-2">{locale === 'ar' ? 'أحدث الفيديوهات' : locale === 'ru' ? 'Последние видео' : 'Latest Videos'}</h2>
            <p className="text-muted-foreground arabic-text">{locale === 'ar' ? 'فيديوهات تعليمية إسلامية مختارة' : 'Selected Islamic educational videos'}</p>
          </div>
          <Link href="/watch" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors arabic-text">
            {t('common.viewAll')} <ArrowIcon className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SAMPLE_VIDEOS.map((video, i) => (
            <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link href={`/watch/${video.id}`} className="block group">
                <div className={`relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${CATEGORY_COLORS[video.category] || 'from-gray-600 to-gray-700'} mb-3`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                    {formatDuration(video.durationSeconds)}
                  </div>
                  {video.aiGenerated && <div className="absolute top-2 left-2 badge bg-purple-600/90 text-white text-xs">🤖 AI</div>}
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {video.channelName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground arabic-text line-clamp-2 group-hover:text-primary-600 transition-colors">{video.titleAr}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-muted-foreground arabic-text truncate">{video.channelName}</p>
                      {video.creatorVerified && <CheckCircle className="w-3 h-3 text-primary-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-0.5"><Eye className="w-3 h-3" /><span>{formatNumber(video.viewCount)}</span></div>
                    </div>
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
