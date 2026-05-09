'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Video, MessageCircle, Award, TrendingUp, Clock, Star, Play } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import { coursesApi, aiApi } from '@/lib/api';
import { Progress, Avatar, Badge, Skeleton } from '@/components/ui';
import type { AIConversation } from '@/types';

export default function DashboardClient() {
  const { locale } = useI18n();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const { data: enrollmentsData, isLoading: enrollLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => coursesApi.getMyEnrolled(),
    enabled: isAuthenticated,
  });

  const { data: conversationsData } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations(),
    enabled: isAuthenticated,
  });

  const enrollments = (enrollmentsData as { enrollments?: Record<string, unknown>[] })?.enrollments || [];
  const conversations: AIConversation[] = (conversationsData as { conversations?: AIConversation[] })?.conversations || [];

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const QUICK_STATS = [
    { label_ar: 'الدورات المسجلة', label_ru: 'Записанных курсов', value: enrollments.length, icon: BookOpen, color: 'from-blue-500 to-cyan-600' },
    { label_ar: 'الدورات المكتملة', label_ru: 'Завершённых курсов', value: enrollments.filter((e: Record<string, unknown>) => e.is_completed).length, icon: Award, color: 'from-green-500 to-emerald-600' },
    { label_ar: 'محادثات AI', label_ru: 'Разговоров с ИИ', value: conversations.length, icon: MessageCircle, color: 'from-purple-500 to-violet-600' },
    { label_ar: 'نقاط السمعة', label_ru: 'Очков репутации', value: user.reputationPoints || 0, icon: Star, color: 'from-gold-500 to-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-islamic-dark to-islamic-navy py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.avatarUrl} size="xl" />
            <div>
              <p className="text-gray-400 text-sm arabic-text">{locale === 'ar' ? 'مرحباً بك،' : locale === 'ru' ? 'Добро пожаловать,' : 'Welcome,'}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white arabic-text">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' || user.role === 'superadmin' ? 'red' : user.role === 'teacher' ? 'green' : 'primary'} className="text-xs">
                  {user.role}
                </Badge>
                {user.isVerified && <Badge variant="green" className="text-xs">✓ {locale === 'ar' ? 'موثق' : 'Verified'}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_STATS.map(({ label_ar, label_ru, value, icon: Icon, color }, i) => (
            <motion.div key={label_ar} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground arabic-text mt-0.5">{locale === 'ar' ? label_ar : label_ru}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enrolled courses */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground arabic-text">{locale === 'ar' ? 'دوراتي' : locale === 'ru' ? 'Мои курсы' : 'My Courses'}</h2>
                <Link href="/courses" className="text-primary-600 text-sm hover:underline arabic-text">{locale === 'ar' ? 'استكشف المزيد' : 'Explore more'}</Link>
              </div>
              {enrollLoading ? (
                <div className="p-5 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
              ) : enrollments.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground arabic-text mb-4">{locale === 'ar' ? 'لم تسجل في أي دورة بعد' : 'No courses enrolled yet'}</p>
                  <Link href="/courses" className="btn-primary text-sm arabic-text">{locale === 'ar' ? 'استكشف الدورات' : 'Explore Courses'}</Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {enrollments.slice(0, 5).map((enr: Record<string, unknown>) => (
                    <div key={enr.id as string} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-islamic-green/30 to-primary-600/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground arabic-text line-clamp-1">{enr.title as string}</p>
                        <p className="text-xs text-muted-foreground arabic-text">{enr.instructor_name as string}</p>
                        <div className="mt-2">
                          <Progress value={enr.progress as number} showLabel />
                        </div>
                      </div>
                      <Link href={`/courses/${enr.course_id}`}
                        className="p-2 rounded-lg bg-primary-100 dark:bg-primary-950/30 text-primary-600 hover:bg-primary-200 transition-colors shrink-0">
                        <Play className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent AI conversations */}
          <div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground arabic-text">{locale === 'ar' ? 'محادثات AI' : 'AI Chats'}</h2>
                <Link href="/ask-imam" className="text-primary-600 text-sm hover:underline arabic-text">{locale === 'ar' ? 'محادثة جديدة' : 'New chat'}</Link>
              </div>
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm arabic-text mb-3">{locale === 'ar' ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
                  <Link href="/ask-imam" className="btn-primary text-sm arabic-text">{locale === 'ar' ? 'اسأل الإمام' : 'Ask Imam'}</Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.slice(0, 6).map(conv => (
                    <Link key={conv.id} href={`/ask-imam?conv=${conv.id}`}
                      className="block p-4 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium text-foreground arabic-text line-clamp-1">
                        {conv.title || (locale === 'ar' ? 'محادثة' : 'Conversation')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="primary" className="text-xs">{conv.category}</Badge>
                        <span className="text-xs text-muted-foreground">{conv.messageCount} {locale === 'ar' ? 'رسالة' : 'msgs'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
