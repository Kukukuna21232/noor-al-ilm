'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { videoApi } from '@/lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(500),
  title_ar: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'اختر تصنيفاً'),
  language: z.string().default('ar'),
  visibility: z.string().default('private'),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = [
  { value: 'quranStudies', label: 'علوم القرآن' },
  { value: 'arabic', label: 'اللغة العربية' },
  { value: 'history', label: 'التاريخ الإسلامي' },
  { value: 'culture', label: 'الثقافة الإسلامية' },
  { value: 'general', label: 'عام' },
];

interface VideoUploaderProps { onSuccess?: (videoId: string) => void; }

export default function VideoUploader({ onSuccess }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [videoId, setVideoId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  });

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error('اختر ملف فيديو'); return; }
    setUploadState('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });

      const result = await videoApi.uploadVideo(formData, (pct) => setUploadProgress(pct)) as { videoId: string };
      setVideoId(result.videoId);
      setUploadState('processing');
      toast.success('تم رفع الفيديو! جاري المعالجة...');
      onSuccess?.(result.videoId);
    } catch (err: unknown) {
      setUploadState('error');
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'فشل رفع الفيديو');
    }
  };

  const fmtSize = (bytes: number) => bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <h2 className="font-bold text-foreground arabic-text text-lg">رفع فيديو جديد</h2>

      {uploadState === 'done' ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-foreground arabic-text mb-2">تم رفع الفيديو بنجاح!</p>
          <p className="text-muted-foreground arabic-text mb-4">جاري معالجة الفيديو وسيكون متاحاً قريباً</p>
          {videoId && <a href={`/watch/${videoId}`} className="btn-primary inline-flex arabic-text">معاينة الفيديو</a>}
        </div>
      ) : uploadState === 'processing' ? (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
          <p className="text-xl font-bold text-foreground arabic-text mb-2">جاري معالجة الفيديو</p>
          <p className="text-muted-foreground arabic-text">يتم الآن ترميز الفيديو وإنشاء جودات متعددة...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Dropzone */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border hover:border-primary-400 hover:bg-muted/30'}`}>
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <Video className="w-12 h-12 text-primary-500 mx-auto" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{fmtSize(file.size)}</p>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 mx-auto">
                    <X className="w-4 h-4" />إزالة
                  </button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-medium text-foreground arabic-text">{isDragActive ? 'أفلت الملف هنا' : 'اسحب وأفلت الفيديو هنا'}</p>
                  <p className="text-sm text-muted-foreground arabic-text">أو انقر للاختيار</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM, MOV • حتى 2GB</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload progress */}
          {uploadState === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground arabic-text">جاري الرفع...</span>
                <span className="font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-islamic-green to-primary-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">عنوان الفيديو *</label>
              <input {...register('title')} placeholder="أدخل عنوان الفيديو" className="input-field arabic-text" />
              {errors.title && <p className="text-red-500 text-xs mt-1 arabic-text">{errors.title.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">العنوان بالعربية</label>
              <input {...register('title_ar')} placeholder="العنوان بالعربية (اختياري)" className="input-field arabic-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">التصنيف *</label>
              <select {...register('category')} className="input-field arabic-text">
                <option value="">اختر تصنيفاً</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1 arabic-text">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">الخصوصية</label>
              <select {...register('visibility')} className="input-field arabic-text">
                <option value="private">خاص</option>
                <option value="unlisted">غير مدرج</option>
                <option value="public">عام</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground arabic-text mb-1.5">الوصف</label>
              <textarea {...register('description')} rows={3} placeholder="وصف الفيديو..." className="input-field arabic-text resize-none" />
            </div>
          </div>

          <button type="submit" disabled={!file || uploadState === 'uploading'} className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed arabic-text">
            {uploadState === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الرفع...</> : <><Upload className="w-4 h-4" />رفع الفيديو</>}
          </button>
        </form>
      )}
    </div>
  );
}
