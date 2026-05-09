'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Upload, Video, BarChart3, Wand2, Settings, Plus, Eye, ThumbsUp, Clock, Globe, Trash2, Play, CheckCircle, XCircle, Edit } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';

type Tab = 'videos' | 'upload' | 'ai' | 'analytics' | 'settings';

const MOCK_VIDEOS = [
  { id: '1', title: 'مقدمة في أحكام التجويد', status: 'ready', visibility: 'public', views: 12400, likes: 843, duration: '20:45', thumb: '📖', moderation: 'approved' },
  { id: '2', title: 'شرح سورة الفاتحة', status: 'ready', visibility: 'public', views: 8200, likes: 612, duration: '18:30', thumb: '🌙', moderation: 'approved' },
  { id: '3', title: 'أحكام الصلاة للمبتدئين', status: 'transcoding', visibility: 'private', views: 0, likes: 0, duration: '--', thumb: '🕋', moderation: 'pending' },
  { id: '4', title: 'تاريخ الإسلام في روسيا', status: 'draft', visibility: 'private', views: 0, likes: 0, duration: '35:00', thumb: '🕌', moderation: 'pending' },
];

const STATUS_CFG: Record<string, { label_ar: string; label_ru: string; color: string; icon: React.ElementType }> = {
  ready:       { label_ar: 'جاهز',   label_ru: 'Готово',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    icon: CheckCircle },
  transcoding: { label_ar: 'ترميز',  label_ru: 'Кодирование', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        icon: Clock },
  draft:       { label_ar: 'مسودة',  label_ru: 'Черновик',    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',            icon: Edit },
  failed:      { label_ar: 'فشل',    label_ru: 'Ошибка',      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             icon: XCircle },
};

const TABS: { key: Tab; label_ar: string; label_ru: string; icon: React.ElementType }[] = [
  { key: 'videos',    label_ar: 'فيديوهاتي',  label_ru: 'Мои видео',    icon: Video },
  { key: 'upload',    label_ar: 'رفع فيديو',   label_ru: 'Загрузить',    icon: Upload },
  { key: 'ai',        label_ar: 'توليد AI',    label_ru: 'Генерация AI', icon: Wand2 },
  { key: 'analytics', label_ar: 'التحليلات',   label_ru: 'Аналитика',    icon: BarChart3 },
  { key: 'settings',  label_ar: 'الإعدادات',   label_ru: 'Настройки',    icon: Settings },
];

export default function StudioPage() {
  const { locale } = useI18n();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [dragOver, setDragOver] = useState(false);

  const t = (ar: string, ru: string) => locale === 'ar' ? ar : ru;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalViews = MOCK_VIDEOS.reduce((s, v) => s + v.views, 0);
  const totalLikes = MOCK_VIDEOS.reduce((s, v) => s + v.likes, 0);

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
                <p className="font-bold text-white text-sm arabic-text">{t('استوديو المبدع', 'Студия создателя')}</p>
                <p className="text-gray-400 text-xs">Creator Studio</p>
              </div>
            </div>
            <button onClick={() => setActiveTab('upload')} className="btn-primary !px-4 !py-2 !text-sm arabic-text">
              <Plus className="w-4 h-4" />{t('رفع فيديو', 'Загрузить видео')}
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label_ar, label_ru, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap arabic-text ${activeTab === key ? 'border-primary-400 text-primary-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{locale === 'ar' ? label_ar : label_ru}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label_ar: 'إجمالي الفيديوهات', label_ru: 'Всего видео', value: MOCK_VIDEOS.length, icon: Video, color: 'from-blue-500 to-cyan-600' },
            { label_ar: 'إجمالي المشاهدات', label_ru: 'Всего просмотров', value: formatNumber(totalViews), icon: Eye, color: 'from-green-500 to-emerald-600' },
            { label_ar: 'الإعجابات', label_ru: 'Лайки', value: formatNumber(totalLikes), icon: ThumbsUp, color: 'from-gold-500 to-amber-600' },
            { label_ar: 'منشور', label_ru: 'Опубликовано', value: MOCK_VIDEOS.filter(v => v.visibility === 'public').length, icon: Globe, color: 'from-primary-500 to-primary-700' },
          ].map(({ label_ar, label_ru, value, icon: Icon, color }, i) => (
            <motion.div key={label_ar} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground arabic-text mt-0.5">{locale === 'ar' ? label_ar : label_ru}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

            {/* Videos tab */}
            {activeTab === 'videos' && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-foreground arabic-text">{t('إدارة الفيديوهات', 'Управление видео')}</h2>
                  <span className="text-sm text-muted-foreground arabic-text">{MOCK_VIDEOS.length} {t('فيديو', 'видео')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>{[t('الفيديو','Видео'), t('الحالة','Статус'), t('المشاهدات','Просмотры'), t('الإعجابات','Лайки'), t('الإجراءات','Действия')].map(h => (
                        <th key={h} className="px-4 py-3 text-right text-xs font-medium text-muted-foreground arabic-text whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_VIDEOS.map(v => {
                        const cfg = STATUS_CFG[v.status] || STATUS_CFG.draft;
                        const StatusIcon = cfg.icon;
                        return (
                          <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-12 rounded-lg bg-gradient-to-br from-islamic-green/30 to-primary-600/30 flex items-center justify-center shrink-0 text-2xl">{v.thumb}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground arabic-text line-clamp-1">{v.title}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{v.duration}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                                <StatusIcon className="w-3 h-3" />{locale === 'ar' ? cfg.label_ar : cfg.label_ru}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatNumber(v.views)}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{formatNumber(v.likes)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                {v.status === 'ready' && <Link href={`/watch/${v.id}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Eye className="w-3.5 h-3.5" /></Link>}
                                <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload tab */}
            {activeTab === 'upload' && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-bold text-foreground arabic-text text-lg mb-6">{t('رفع فيديو إسلامي جديد', 'Загрузить новое исламское видео')}</h2>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); }}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-border hover:border-primary-400 hover:bg-muted/30'}`}
                >
                  <Upload className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                  <p className="font-bold text-foreground arabic-text text-lg mb-2">{t('اسحب وأفلت الفيديو هنا', 'Перетащите видео сюда')}</p>
                  <p className="text-muted-foreground text-sm arabic-text mb-4">{t('أو انقر للاختيار', 'или нажмите для выбора')}</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM, MOV — {t('حتى 2GB', 'до 2GB')}</p>
                  <div className="mt-6 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl inline-block">
                    <p className="text-green-700 dark:text-green-400 text-xs arabic-text">
                      ✓ {t('يُرجى التأكد من أن المحتوى حلال ومفيد للمسلمين', 'Убедитесь, что контент халяль и полезен для мусульман')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{t('عنوان الفيديو', 'Название видео')}</label><input className="input-field arabic-text" placeholder={t('أدخل عنوان الفيديو', 'Введите название')} /></div>
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{t('التصنيف', 'Категория')}</label>
                    <select className="input-field arabic-text">
                      <option value="">{t('اختر تصنيفاً', 'Выберите категорию')}</option>
                      <option value="quranStudies">{t('علوم القرآن', 'Коранические науки')}</option>
                      <option value="arabic">{t('اللغة العربية', 'Арабский язык')}</option>
                      <option value="history">{t('التاريخ الإسلامي', 'История ислама')}</option>
                      <option value="fiqh">{t('الفقه', 'Фикх')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{t('الوصف', 'Описание')}</label><textarea rows={3} className="input-field arabic-text resize-none" placeholder={t('وصف الفيديو...', 'Описание видео...')} /></div>
                </div>
                <button className="btn-primary mt-6 arabic-text"><Upload className="w-4 h-4" />{t('رفع الفيديو', 'Загрузить видео')}</button>
              </div>
            )}

            {/* AI tab */}
            {activeTab === 'ai' && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-bold text-foreground arabic-text text-lg mb-2">{t('توليد محتوى بالذكاء الاصطناعي', 'Генерация контента с помощью ИИ')}</h2>
                <p className="text-muted-foreground text-sm arabic-text mb-6">{t('أنشئ سكريبت، تعليق صوتي، ترجمة، أو صورة مصغرة بالذكاء الاصطناعي', 'Создайте сценарий, озвучку, субтитры или миниатюру с помощью ИИ')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: '📝', label_ar: 'توليد سكريبت', label_ru: 'Генерация сценария', desc_ar: 'أنشئ سكريبت تعليمي إسلامي', desc_ru: 'Создайте исламский образовательный сценарий' },
                    { icon: '🎙️', label_ar: 'تعليق صوتي', label_ru: 'Озвучка', desc_ar: 'حوّل النص إلى صوت طبيعي', desc_ru: 'Преобразуйте текст в естественный голос' },
                    { icon: '💬', label_ar: 'توليد ترجمة', label_ru: 'Генерация субтитров', desc_ar: 'أنشئ ترجمة تلقائية للفيديو', desc_ru: 'Создайте автоматические субтитры' },
                    { icon: '🖼️', label_ar: 'صورة مصغرة AI', label_ru: 'Миниатюра AI', desc_ar: 'أنشئ صورة مصغرة احترافية', desc_ru: 'Создайте профессиональную миниатюру' },
                  ].map(item => (
                    <button key={item.label_ar} className="p-5 bg-muted/50 hover:bg-muted border border-border rounded-2xl text-right transition-all hover:border-primary-300 hover:shadow-md group">
                      <span className="text-3xl block mb-3">{item.icon}</span>
                      <p className="font-bold text-foreground arabic-text group-hover:text-primary-600 transition-colors">{locale === 'ar' ? item.label_ar : item.label_ru}</p>
                      <p className="text-muted-foreground text-xs arabic-text mt-1">{locale === 'ar' ? item.desc_ar : item.desc_ru}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics tab */}
            {activeTab === 'analytics' && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="font-bold text-foreground arabic-text text-lg mb-2">{t('التحليلات التفصيلية', 'Подробная аналитика')}</p>
                <p className="text-muted-foreground arabic-text text-sm">{t('ستتوفر التحليلات بعد نشر فيديوهاتك', 'Аналитика будет доступна после публикации видео')}</p>
              </div>
            )}

            {/* Settings tab */}
            {activeTab === 'settings' && (
              <div className="bg-card border border-border rounded-2xl p-8 max-w-lg">
                <h2 className="font-bold text-foreground arabic-text mb-6">{t('إعدادات القناة', 'Настройки канала')}</h2>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{t('اسم القناة', 'Название канала')}</label><input className="input-field arabic-text" defaultValue={user.name} /></div>
                  <div><label className="block text-sm font-medium text-foreground arabic-text mb-1.5">{t('وصف القناة', 'Описание канала')}</label><textarea rows={3} className="input-field arabic-text resize-none" placeholder={t('نبذة عن قناتك...', 'О вашем канале...')} /></div>
                  <button className="btn-primary arabic-text">{t('حفظ التغييرات', 'Сохранить изменения')}</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
