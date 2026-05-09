'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, FileText, Mic, Subtitles, Image, Languages, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '@/lib/api';
import toast from 'react-hot-toast';

type AITool = 'script' | 'voiceover' | 'subtitles' | 'thumbnail' | 'translate';

const TOOLS: { key: AITool; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { key: 'script',    label: 'توليد سكريبت',    icon: FileText,   desc: 'أنشئ سكريبت تعليمي بالذكاء الاصطناعي',    color: 'from-blue-500 to-cyan-600' },
  { key: 'voiceover', label: 'تعليق صوتي',       icon: Mic,        desc: 'حوّل النص إلى صوت بشري طبيعي',            color: 'from-green-500 to-emerald-600' },
  { key: 'subtitles', label: 'توليد ترجمة',      icon: Subtitles,  desc: 'أنشئ ترجمة تلقائية للفيديو',              color: 'from-purple-500 to-violet-600' },
  { key: 'thumbnail', label: 'صورة مصغرة AI',    icon: Image,      desc: 'أنشئ صورة مصغرة احترافية بالذكاء الاصطناعي', color: 'from-gold-500 to-amber-600' },
  { key: 'translate', label: 'ترجمة الترجمة',    icon: Languages,  desc: 'ترجم الترجمة إلى لغة أخرى',               color: 'from-red-500 to-rose-600' },
];

const STATUS_ICON: Record<string, React.ElementType> = { queued: Clock, processing: Loader2, completed: CheckCircle, failed: XCircle };
const STATUS_COLOR: Record<string, string> = { queued: 'text-yellow-500', processing: 'text-blue-500', completed: 'text-green-500', failed: 'text-red-500' };

export default function AIGeneratorPanel() {
  const [activeTool, setActiveTool] = useState<AITool>('script');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('ar');
  const [duration, setDuration] = useState(5);
  const [text, setText] = useState('');
  const [videoId, setVideoId] = useState('');
  const [targetLang, setTargetLang] = useState('ru');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const { data: jobsData, refetch: refetchJobs } = useQuery({ queryKey: ['ai-jobs'], queryFn: () => videoApi.getAIJobs(), refetchInterval: 5000 });

  const scriptMutation = useMutation({
    mutationFn: () => videoApi.generateScript({ topic, language, duration, style: 'educational', category: 'general' }),
    onSuccess: (data) => { setResult(data as Record<string, unknown>); toast.success('تم إرسال طلب توليد السكريبت'); refetchJobs(); },
    onError: () => toast.error('فشل توليد السكريبت'),
  });

  const voiceoverMutation = useMutation({
    mutationFn: () => videoApi.generateVoiceover({ text, language, voice: 'alloy', videoId: videoId || undefined }),
    onSuccess: () => { toast.success('تم إرسال طلب التعليق الصوتي'); refetchJobs(); },
    onError: () => toast.error('فشل توليد التعليق الصوتي'),
  });

  const subtitlesMutation = useMutation({
    mutationFn: () => videoApi.generateSubtitles(videoId, language),
    onSuccess: () => { toast.success('تم إرسال طلب توليد الترجمة'); refetchJobs(); },
    onError: () => toast.error('فشل توليد الترجمة'),
  });

  const thumbnailMutation = useMutation({
    mutationFn: () => videoApi.generateThumbnail(videoId),
    onSuccess: () => { toast.success('تم إرسال طلب توليد الصورة المصغرة'); refetchJobs(); },
    onError: () => toast.error('فشل توليد الصورة المصغرة'),
  });

  const translateMutation = useMutation({
    mutationFn: () => videoApi.translateSubtitles(videoId, targetLang, language),
    onSuccess: () => { toast.success('تم إرسال طلب الترجمة'); refetchJobs(); },
    onError: () => toast.error('فشل الترجمة'),
  });

  const jobs = (jobsData as { jobs: Record<string, unknown>[] })?.jobs || [];

  return (
    <div className="space-y-6">
      {/* Tool selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TOOLS.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setActiveTool(key)}
            className={`p-4 rounded-2xl border-2 transition-all text-center ${activeTool === key ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-border hover:border-primary-300 bg-card'}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-2 shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-medium text-foreground arabic-text">{label}</p>
          </button>
        ))}
      </div>

      {/* Tool form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground arabic-text mb-4">{TOOLS.find(t => t.key === activeTool)?.label}</h3>
        <p className="text-muted-foreground text-sm arabic-text mb-5">{TOOLS.find(t => t.key === activeTool)?.desc}</p>

        <AnimatePresence mode="wait">
          <motion.div key={activeTool} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

            {activeTool === 'script' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">موضوع الفيديو *</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="مثال: أحكام التجويد للمبتدئين" className="input-field arabic-text" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">اللغة</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field arabic-text">
                      <option value="ar">العربية</option>
                      <option value="ru">الروسية</option>
                      <option value="en">الإنجليزية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">المدة (دقائق)</label>
                    <input type="number" min={1} max={30} value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="input-field" />
                  </div>
                </div>
                <button onClick={() => scriptMutation.mutate()} disabled={!topic.trim() || scriptMutation.isPending} className="btn-primary arabic-text disabled:opacity-50">
                  {scriptMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التوليد...</> : <><Wand2 className="w-4 h-4" />توليد السكريبت</>}
                </button>
                {result && (
                  <div className="bg-muted/50 rounded-xl p-4 mt-4">
                    <p className="font-bold text-foreground arabic-text mb-2">{(result as { title?: string }).title}</p>
                    <p className="text-sm text-muted-foreground arabic-text">{(result as { intro?: string }).intro}</p>
                  </div>
                )}
              </>
            )}

            {activeTool === 'voiceover' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">النص المراد تحويله *</label>
                  <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="أدخل النص هنا..." className="input-field arabic-text resize-none" maxLength={5000} />
                  <p className="text-xs text-muted-foreground mt-1">{text.length}/5000</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">اللغة</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field arabic-text">
                      <option value="ar">العربية</option>
                      <option value="ru">الروسية</option>
                      <option value="en">الإنجليزية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">معرف الفيديو (اختياري)</label>
                    <input value={videoId} onChange={e => setVideoId(e.target.value)} placeholder="video-id" className="input-field" />
                  </div>
                </div>
                <button onClick={() => voiceoverMutation.mutate()} disabled={!text.trim() || voiceoverMutation.isPending} className="btn-primary arabic-text disabled:opacity-50">
                  {voiceoverMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التوليد...</> : <><Mic className="w-4 h-4" />توليد التعليق الصوتي</>}
                </button>
              </>
            )}

            {(activeTool === 'subtitles' || activeTool === 'thumbnail') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">معرف الفيديو *</label>
                  <input value={videoId} onChange={e => setVideoId(e.target.value)} placeholder="أدخل معرف الفيديو" className="input-field" />
                </div>
                {activeTool === 'subtitles' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">لغة الفيديو</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field arabic-text">
                      <option value="ar">العربية</option>
                      <option value="ru">الروسية</option>
                      <option value="en">الإنجليزية</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={() => activeTool === 'subtitles' ? subtitlesMutation.mutate() : thumbnailMutation.mutate()}
                  disabled={!videoId.trim() || subtitlesMutation.isPending || thumbnailMutation.isPending}
                  className="btn-primary arabic-text disabled:opacity-50"
                >
                  {(subtitlesMutation.isPending || thumbnailMutation.isPending)
                    ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التوليد...</>
                    : <><Wand2 className="w-4 h-4" />{activeTool === 'subtitles' ? 'توليد الترجمة' : 'توليد الصورة المصغرة'}</>}
                </button>
              </>
            )}

            {activeTool === 'translate' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">معرف الفيديو *</label>
                  <input value={videoId} onChange={e => setVideoId(e.target.value)} placeholder="أدخل معرف الفيديو" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">اللغة المصدر</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field arabic-text">
                      <option value="ar">العربية</option>
                      <option value="ru">الروسية</option>
                      <option value="en">الإنجليزية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">اللغة الهدف</label>
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="input-field arabic-text">
                      <option value="ru">الروسية</option>
                      <option value="ar">العربية</option>
                      <option value="en">الإنجليزية</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => translateMutation.mutate()} disabled={!videoId.trim() || translateMutation.isPending} className="btn-primary arabic-text disabled:opacity-50">
                  {translateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الترجمة...</> : <><Languages className="w-4 h-4" />ترجمة الترجمة</>}
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground arabic-text mb-4">المهام الأخيرة</h3>
          <div className="space-y-3">
            {jobs.slice(0, 8).map((job) => {
              const StatusIcon = STATUS_ICON[job.status as string] || Clock;
              return (
                <div key={job.id as string} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-4 h-4 ${STATUS_COLOR[job.status as string] || 'text-muted-foreground'} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground arabic-text">{job.job_type as string}</p>
                      {job.error_message && <p className="text-xs text-red-500">{job.error_message as string}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'processing' && (
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${job.progress || 0}%` }} />
                      </div>
                    )}
                    <span className={`badge text-xs ${STATUS_COLOR[job.status as string]}`}>{job.status as string}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
