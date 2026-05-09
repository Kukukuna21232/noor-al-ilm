'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, BarChart3, Settings, Wand2, Plus, Eye, ThumbsUp, Clock, CheckCircle, XCircle, Edit, Globe, Trash2, Play } from 'lucide-react';
import { videoApi } from '@/lib/api';
import VideoUploader from '@/components/studio/VideoUploader';
import AIGeneratorPanel from '@/components/studio/AIGeneratorPanel';
import StudioAnalytics from '@/components/studio/StudioAnalytics';
import toast from 'react-hot-toast';

type Tab = 'videos' | 'upload' | 'ai' | 'analytics' | 'settings';

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ready:       { label: 'جاهز',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    icon: CheckCircle },
  processing:  { label: 'معالجة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       icon: Clock },
  transcoding: { label: 'ترميز',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  draft:       { label: 'مسودة',  color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',           icon: Edit },
  failed:      { label: 'فشل',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',            icon: XCircle },
};

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: () => videoApi.getStudioDashboard() });

  const publishMutation = useMutation({
    mutationFn: (id: string) => videoApi.publishVideo(id),
    onSuccess: () => { toast.success('تم نشر الفيديو'); qc.invalidateQueries({ queryKey: ['studio-dashboard'] }); },
    onError: () => toast.error('فشل نشر الفيديو'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: () => { toast.success('تم حذف الفيديو'); qc.invalidateQueries({ queryKey: ['studio-dashboard'] }); },
  });

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'videos',    label: 'فيديوهاتي',  icon: Video },
    { key: 'upload',    label: 'رفع فيديو',   icon: Upload },
    { key: 'ai',        label: 'توليد AI',    icon: Wand2 },
    { key: 'analytics', label: 'التحليلات',   icon: BarChart3 },
    { key: 'settings',  label: 'الإعدادات',   icon: Settings },
  ];

  const stats = (data as Record<string, unknown>)?.stats as Record<string, unknown> | undefined;
  const videos = ((data as Record<string, unknown>)?.videos as Record<string, unknown>[]) || [];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-islamic-dark to-islamic-navy border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm arabic-text">استوديو المبدع</p>
                <p className="text-gray-400 text-xs">Creator Studio</p>
              </div>
            </div>
            <button onClick={() => setActiveTab('upload')} className="btn-primary !px-4 !py-2 !text-sm">
              <Plus className="w-4 h-4" /><span className="arabic-text">رفع فيديو</span>
            </button>
          </div>
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all arabic-text ${activeTab === key ? 'border-primary-400 text-primary-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'إجمالي الفيديوهات', value: stats.total_videos, icon: Video, color: 'from-blue-500 to-cyan-600' },
              { label: 'إجمالي المشاهدات', value: Number(stats.total_views || 0).toLocaleString('ar-SA'), icon: Eye, color: 'from-green-500 to-emerald-600' },
              { label: 'الإعجابات', value: Number(stats.total_likes || 0).toLocaleString('ar-SA'), icon: ThumbsUp, color: 'from-gold-500 to-amber-600' },
              { label: 'منشور', value: stats.published_videos, icon: Globe, color: 'from-primary-500 to-primary-700' },
              { label: 'قيد المعالجة', value: stats.processing_videos, icon: Clock, color: 'from-purple-500 to-violet-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-foreground">{value as string}</p>
                <p className="text-xs text-muted-foreground arabic-text mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {activeTab === 'videos' && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-foreground arabic-text">إدارة الفيديوهات</h2>
                  <span className="text-sm text-muted-foreground arabic-text">{videos.length} فيديو</span>
                </div>
                {isLoading ? (
                  <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : videos.length === 0 ? (
                  <div className="p-16 text-center">
                    <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground arabic-text text-lg mb-4">لا توجد فيديوهات بعد</p>
                    <button onClick={() => setActiveTab('upload')} className="btn-primary arabic-text"><Upload className="w-4 h-4" />ارفع أول فيديو</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>{['الفيديو', 'الحالة', 'المشاهدات', 'الإعجابات', 'الإجراءات'].map(h => (
                          <th key={h} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground arabic-text whitespace-nowrap">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {videos.map((v) => {
                          const cfg = STATUS_CFG[v.status as string] || STATUS_CFG.draft;
                          const StatusIcon = cfg.icon;
                          return (
                            <tr key={v.id as string} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                    {v.thumbnail_url ? <img src={v.thumbnail_url as string} alt="" className="w-full h-full object-cover" />
                                      : <div className="w-full h-full bg-gradient-to-br from-islamic-green/30 to-primary-600/30 flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground" /></div>}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground arabic-text line-clamp-1">{v.title as string}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {v.duration_seconds ? `${Math.floor((v.duration_seconds as number)/60)}:${String(Math.floor((v.duration_seconds as number)%60)).padStart(2,'0')}` : '--'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`badge text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                                  <StatusIcon className="w-3 h-3" />{cfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">{Number(v.view_count || 0).toLocaleString('ar-SA')}</td>
                              <td className="px-4 py-3 text-sm text-foreground">{Number(v.like_count || 0).toLocaleString('ar-SA')}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {v.status === 'ready' && v.visibility !== 'public' && (
                                    <button onClick={() => publishMutation.mutate(v.id as string)} disabled={publishMutation.isPending}
                                      className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="نشر">
                                      <Globe className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <a href={`/watch/${v.id}`} target="_blank" rel="noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="معاينة">
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                  <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) deleteMutation.mutate(v.id as string); }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600" title="حذف">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'upload' && <VideoUploader onSuccess={() => { setActiveTab('videos'); qc.invalidateQueries({ queryKey: ['studio-dashboard'] }); }} />}
            {activeTab === 'ai' && <AIGeneratorPanel />}
            {activeTab === 'analytics' && <StudioAnalytics />}
            {activeTab === 'settings' && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-bold text-foreground arabic-text mb-6">إعدادات القناة</h2>
                <div className="space-y-4 max-w-lg">
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">اسم القناة</label><input type="text" placeholder="اسم قناتك" className="input-field arabic-text" /></div>
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">وصف القناة</label><textarea rows={3} placeholder="نبذة عن قناتك..." className="input-field arabic-text resize-none" /></div>
                  <button className="btn-primary arabic-text">حفظ التغييرات</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
