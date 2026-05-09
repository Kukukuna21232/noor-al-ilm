'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ThumbsUp, ThumbsDown, Bookmark, Share2, Flag, Bell, BellOff, Eye, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import VideoPlayer from '@/components/player/VideoPlayer';
import VideoCard from '@/components/video/VideoCard';
import CommentSection from '@/components/video/CommentSection';
import { videoApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function WatchPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [descExpanded, setDescExpanded] = useState(false);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['video', id], queryFn: () => videoApi.getVideo(id), enabled: !!id });
  const { data: manifestData } = useQuery({ queryKey: ['manifest', id], queryFn: () => videoApi.getManifest(id), enabled: !!id });

  useEffect(() => { if ((manifestData as { manifestUrl?: string })?.manifestUrl) setManifestUrl((manifestData as { manifestUrl: string }).manifestUrl); }, [manifestData]);

  const likeMutation = useMutation({
    mutationFn: ({ isLike }: { isLike: boolean }) => videoApi.likeVideo(id, isLike),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['video', id] }),
  });
  const bookmarkMutation = useMutation({
    mutationFn: () => videoApi.bookmarkVideo(id),
    onSuccess: (res) => toast.success((res as { bookmarked: boolean }).bookmarked ? 'تم الحفظ' : 'تم الإلغاء'),
  });

  const progressCallback = useCallback((position: number, percent: number) => {
    if (user && percent > 0 && percent % 10 === 0) videoApi.updateWatchProgress(id, position, percent).catch(() => {});
  }, [id, user]);

  if (isLoading) return <WatchSkeleton />;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground arabic-text">فيديو غير موجود</p></div>;

  const { video, subtitles = [], related = [], userLiked, userBookmarked, isSubscribed } = data as Record<string, unknown>;
  const v = video as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {/* Player */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              {manifestUrl ? (
                <VideoPlayer manifestUrl={manifestUrl} thumbnailUrl={(v.thumbnail_url || v.ai_thumbnail_url) as string} subtitles={subtitles as { language: string; label: string; file_url: string }[]}
                  title={(v.title_ar || v.title) as string} startPosition={(data as Record<string, unknown>).watchProgress ? ((data as Record<string, Record<string, number>>).watchProgress?.last_position_seconds || 0) : 0}
                  onProgress={progressCallback} isRTL />
              ) : (
                <div className="aspect-video bg-black rounded-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm arabic-text">جاري تحميل الفيديو...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-bold text-foreground arabic-text leading-tight">{(v.title_ar || v.title) as string}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{Number(v.view_count || 0).toLocaleString('ar-SA')} مشاهدة</span></div>
                <span>·</span>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />
                  <span>{v.published_at ? formatDistanceToNow(new Date(v.published_at as string), { addSuffix: true, locale: ar }) : ''}</span>
                </div>
                <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs">{v.category as string}</span>
                {v.ai_generated && <span className="badge bg-purple-100 text-purple-700 text-xs">🤖 مولّد بالذكاء الاصطناعي</span>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center rounded-xl overflow-hidden border border-border">
                  <button onClick={() => likeMutation.mutate({ isLike: true })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${userLiked === true ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' : ''}`}>
                    <ThumbsUp className="w-4 h-4" /><span>{Number(v.like_count || 0).toLocaleString()}</span>
                  </button>
                  <div className="w-px h-6 bg-border" />
                  <button onClick={() => likeMutation.mutate({ isLike: false })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${userLiked === false ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : ''}`}>
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => bookmarkMutation.mutate()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted ${userBookmarked ? 'text-gold-600 border-gold-300' : ''}`}>
                  <Bookmark className={`w-4 h-4 ${userBookmarked ? 'fill-gold-500' : ''}`} /><span className="arabic-text">حفظ</span>
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('تم نسخ الرابط'); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted">
                  <Share2 className="w-4 h-4" /><span className="arabic-text">مشاركة</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 mr-auto">
                  <Flag className="w-4 h-4" /><span className="arabic-text">إبلاغ</span>
                </button>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
              <Link href={`/channel/${v.channel_slug}`} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {(v.channel_name as string)?.charAt(0) || 'ن'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground group-hover:text-primary-600 transition-colors arabic-text">{v.channel_name as string}</p>
                    {v.creator_verified && <span className="text-primary-500 text-xs">✓</span>}
                  </div>
                  <p className="text-muted-foreground text-xs arabic-text">{Number(v.subscriber_count || 0).toLocaleString('ar-SA')} مشترك</p>
                </div>
              </Link>
              {user && (
                <button className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${isSubscribed ? 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600' : 'btn-primary'}`}>
                  {isSubscribed ? <><BellOff className="w-4 h-4" /><span className="arabic-text">إلغاء الاشتراك</span></> : <><Bell className="w-4 h-4" /><span className="arabic-text">اشتراك</span></>}
                </button>
              )}
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className={`text-sm text-muted-foreground arabic-text leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                {(v.description_ar || v.description || 'لا يوجد وصف') as string}
              </div>
              {((v.description as string)?.length || 0) > 200 && (
                <button onClick={() => setDescExpanded(!descExpanded)} className="flex items-center gap-1 text-primary-600 text-sm font-medium mt-2 hover:underline arabic-text">
                  {descExpanded ? <><ChevronUp className="w-4 h-4" />عرض أقل</> : <><ChevronDown className="w-4 h-4" />عرض المزيد</>}
                </button>
              )}
            </div>

            <CommentSection videoId={id} commentCount={v.comment_count as number} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            <h3 className="font-bold text-foreground arabic-text">فيديوهات ذات صلة</h3>
            {(related as Record<string, unknown>[]).map((rv) => <VideoCard key={rv.id as string} video={rv} compact />)}
          </aside>
        </div>
      </div>
    </div>
  );
}

function WatchSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="aspect-video bg-muted rounded-2xl animate-pulse" />
          <div className="h-8 bg-muted rounded-xl animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-40 h-24 bg-muted rounded-xl animate-pulse shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded animate-pulse" /><div className="h-3 bg-muted rounded animate-pulse w-2/3" /></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
