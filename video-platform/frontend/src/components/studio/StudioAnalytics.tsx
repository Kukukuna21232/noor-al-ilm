'use client';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Eye, ThumbsUp, Clock, TrendingUp } from 'lucide-react';
import { videoApi } from '@/lib/api';

export default function StudioAnalytics() {
  const { data, isLoading } = useQuery({ queryKey: ['creator-analytics'], queryFn: () => videoApi.getCreatorAnalytics() });
  const analytics = (data as { analytics: Record<string, unknown>[] })?.analytics || [];

  if (isLoading) return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  const totalViews = analytics.reduce((s, d) => s + Number(d.views || 0), 0);
  const totalWatchTime = analytics.reduce((s, d) => s + Number(d.watch_time || 0), 0);
  const totalLikes = analytics.reduce((s, d) => s + Number(d.likes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي المشاهدات (30 يوم)', value: totalViews.toLocaleString('ar-SA'), icon: Eye, color: 'from-blue-500 to-cyan-600' },
          { label: 'وقت المشاهدة (ساعات)', value: Math.round(totalWatchTime / 3600).toLocaleString('ar-SA'), icon: Clock, color: 'from-green-500 to-emerald-600' },
          { label: 'الإعجابات', value: totalLikes.toLocaleString('ar-SA'), icon: ThumbsUp, color: 'from-gold-500 to-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground arabic-text mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground arabic-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />المشاهدات اليومية
        </h3>
        {analytics.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('ar-SA'), 'مشاهدات']} />
              <Area type="monotone" dataKey="views" stroke="#16a34a" fill="url(#viewsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground arabic-text">لا توجد بيانات بعد</p>
          </div>
        )}
      </div>

      {/* Likes chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground arabic-text mb-4">الإعجابات اليومية</h3>
        {analytics.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('ar-SA'), 'إعجابات']} />
              <Bar dataKey="likes" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-muted-foreground arabic-text">لا توجد بيانات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
