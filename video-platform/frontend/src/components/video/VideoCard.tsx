'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Clock, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface VideoCardProps { video: Record<string, unknown>; compact?: boolean; index?: number; }

const fmtDuration = (s: number) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60); return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`; };
const fmtViews = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n || 0);

export default function VideoCard({ video, compact = false, index = 0 }: VideoCardProps) {
  const thumb = (video.thumbnail_url || video.ai_thumbnail_url) as string | undefined;
  const duration = video.duration_seconds as number;
  const views = video.view_count as number;
  const title = (video.title_ar || video.title) as string;
  const channel = video.channel_name as string;
  const isVerified = video.creator_verified as boolean;
  const isAI = video.ai_generated as boolean;

  if (compact) {
    return (
      <Link href={`/watch/${video.id}`} className="flex gap-3 group hover:bg-muted/50 rounded-xl p-2 transition-colors">
        <div className="relative w-40 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
          {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full bg-gradient-to-br from-islamic-green/30 to-primary-600/30 flex items-center justify-center"><span className="text-2xl">🎬</span></div>}
          {duration > 0 && <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">{fmtDuration(duration)}</span>}
          {isAI && <span className="absolute top-1 left-1 bg-purple-600/90 text-white text-xs px-1.5 py-0.5 rounded">AI</span>}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h4 className="text-sm font-medium text-foreground arabic-text line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{title}</h4>
          <div className="flex items-center gap-1 mt-1.5">
            <p className="text-xs text-muted-foreground arabic-text truncate">{channel}</p>
            {isVerified && <CheckCircle className="w-3 h-3 text-primary-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" /><span>{fmtViews(views)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/watch/${video.id}`} className="block group">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted mb-3">
          {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full bg-gradient-to-br from-islamic-green/40 to-primary-700/40 flex items-center justify-center"><span className="text-5xl">🎬</span></div>}
          {duration > 0 && <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-mono">{fmtDuration(duration)}</span>}
          {isAI && <span className="absolute top-2 left-2 bg-purple-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">🤖 AI</span>}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              <svg className="w-6 h-6 text-islamic-dark ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
            {channel?.charAt(0) || 'ن'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground arabic-text line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug text-sm md:text-base">{title}</h3>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground arabic-text truncate">{channel}</p>
              {isVerified && <CheckCircle className="w-3 h-3 text-primary-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5"><Eye className="w-3 h-3" /><span>{fmtViews(views)} مشاهدة</span></div>
              {duration > 0 && <><span>·</span><div className="flex items-center gap-0.5"><Clock className="w-3 h-3" /><span>{fmtDuration(duration)}</span></div></>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
