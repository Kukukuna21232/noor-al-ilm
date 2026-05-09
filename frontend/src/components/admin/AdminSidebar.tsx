'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, Video,
  Shield, BarChart3, Settings, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin',             icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/users',       icon: Users,           label: 'المستخدمون' },
  { href: '/admin/courses',     icon: BookOpen,        label: 'الدورات' },
  { href: '/admin/videos',      icon: Video,           label: 'الفيديوهات' },
  { href: '/admin/moderation',  icon: Shield,          label: 'المراجعة' },
  { href: '/admin/analytics',   icon: BarChart3,       label: 'التحليلات' },
];

const BOTTOM_ITEMS = [
  { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

interface AdminSidebarProps {
  collapsed?: boolean;
}

export default function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className={cn(
      'flex flex-col bg-islamic-dark border-l border-white/10 transition-all duration-300 h-screen sticky top-0',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-bold arabic-text">ن</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm arabic-text leading-none">نور العلم</p>
            <p className="text-gray-500 text-xs mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all arabic-text',
                active
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1 shrink-0">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all arabic-text',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all w-full arabic-text',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-xl bg-white/5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate arabic-text">{user.name}</p>
              <p className="text-gray-500 text-xs truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
