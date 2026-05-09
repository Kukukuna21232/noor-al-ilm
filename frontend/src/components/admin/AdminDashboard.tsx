'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, Video, MessageCircle, Shield, CheckCircle, XCircle, Clock, TrendingUp, Eye, AlertTriangle } from 'lucide-react';
import { useAuthStore, isAdmin } from '@/store/authStore';

const STATS = [
  { label: 'المستخدمون', value: '12,890', change: '+12%', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { label: 'الدورات', value: '487', change: '+5%', icon: BookOpen, color: 'from-green-500 to-emerald-600' },
  { label: 'الفيديوهات', value: '2,341', change: '+18%', icon: Video, color: 'from-purple-500 to-violet-600' },
  { label: 'محادثات AI', value: '34,120', change: '+31%', icon: MessageCircle, color: 'from-gold-500 to-amber-600' },
];

const PENDING = [
  { id: '1', type: 'video', title: 'مقدمة في التجويد', author: 'أحمد محمد', time: 'منذ 10 دقائق' },
  { id: '2', type: 'post', title: 'سؤال عن أحكام الصيام', author: 'أم سلمى', time: 'منذ 25 دقيقة' },
  { id: '3', type: 'video', title: 'تاريخ الإسلام في روسيا', author: 'Иван Петров', time: 'منذ ساعة' },
  { id: '4', type: 'post', title: 'نقاش حول التاريخ الإسلامي', author: 'عبدالله الأنصاري', time: 'منذ ساعتين' },
];

const ACTIVITY = [
  { icon: Users, text: 'تسجيل 45 مستخدم جديد', time: 'اليوم', color: 'text-blue-500' },
  { icon: BookOpen, text: 'نشر دورة جديدة: الفقه الميسر', time: 'منذ 2 ساعة', color: 'text-green-500' },
  { icon: Shield, text: 'تمت مراجعة 12 محتوى', time: 'منذ 3 ساعات', color: 'text-gold-500' },
  { icon: TrendingUp, text: 'ارتفاع المشاهدات 23%', time: 'هذا الأسبوع', color: 'text-purple-500' },
];

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin(user?.role))) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground arabic-text">لوحة الإدارة</h1>
            <p className="text-muted-foreground text-sm arabic-text mt-0.5">مرحباً، {user.name}</p>
          </div>
          <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs px-3 py-1">
            {user.role}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, change, icon: Icon, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-green-600 dark:text-green-400 text-xs font-medium">{change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground arabic-text mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Moderation queue */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-foreground arabic-text">قائمة المراجعة</h2>
              </div>
              <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                {PENDING.length} معلق
              </span>
            </div>
            <div className="divide-y divide-border">
              {PENDING.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`badge text-xs shrink-0 ${item.type === 'video' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {item.type === 'video' ? 'فيديو' : 'موضوع'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground arabic-text truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground arabic-text">{item.author} · {item.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <h2 className="font-bold text-foreground arabic-text">النشاط الأخير</h2>
            </div>
            <div className="divide-y divide-border">
              {ACTIVITY.map(({ icon: Icon, text, time, color }, i) => (
                <div key={i} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground arabic-text">{text}</p>
                    <p className="text-xs text-muted-foreground arabic-text">{time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button className="w-full text-center text-sm text-primary-600 hover:underline arabic-text flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" /> عرض كل النشاط
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
