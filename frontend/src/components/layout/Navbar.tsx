'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Menu, X, Sun, Moon, Globe, ChevronDown, User, LogOut,
  LayoutDashboard, Bell, Search, Shield, BookOpen, Video,
  MessageCircle, Library, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuthStore, isAdmin } from '@/store/authStore';
import { useScrollPosition } from '@/hooks';
import { cn, getInitials } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';
import { LanguageSwitcher, CompactLanguageSwitcher, ArabicRussianToggle } from '@/components/ui/LanguageSwitcher';

const NAV_LINKS = [
  { key: 'nav.home',     href: '/',          icon: null },
  { key: 'nav.quran',    href: '/quran',      icon: BookOpen },
  { key: 'nav.courses',  href: '/courses',    icon: null },
  { key: 'nav.forum',    href: '/forum',      icon: null },
  { key: 'nav.media',    href: '/media',      icon: Library },
  { key: 'nav.askImam',  href: '/ask-imam',   icon: MessageCircle },
];

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function Navbar() {
  const { t, locale, setLocale, dir } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const scrollY = useScrollPosition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const scrolled = scrollY > 20;

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-opacity-95 backdrop-blur-md'
        : 'bg-transparent'
    )} style={{ 
      borderBottom: scrolled ? '0.5px solid rgba(201, 168, 76, 0.25)' : '0.5px solid rgba(201, 168, 76, 0.15)',
      backgroundColor: scrolled ? 'rgba(12, 18, 32, 0.95)' : 'transparent'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform" style={{ backgroundColor: '#1a6b3c' }}>
              <span className="text-lg font-bold arabic-text" style={{ color: '#f0ece0' }}>ن</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold arabic-text leading-none" style={{ color: '#c9a84c' }}>نور العلم</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>Noor Al-Ilm</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(({ key, href }) => (
              <Link key={key} href={href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors arabic-text',
                  pathname === href
                    ? ''
                    : ''
                )}
                style={{ 
                  color: pathname === href ? '#c9a84c' : 'rgba(240, 236, 224, 0.7)',
                  backgroundColor: pathname === href ? 'rgba(201, 168, 76, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== href) {
                    e.currentTarget.style.color = '#f0ece0';
                    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== href) {
                    e.currentTarget.style.color = 'rgba(240, 236, 224, 0.7)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}>
                {t(key)}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <Link href="/search" className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(240, 236, 224, 0.6)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f0ece0'; e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240, 236, 224, 0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <Search className="w-4 h-4" />
            </Link>

            {/* Theme toggle */}
            {mounted && (
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg transition-colors" style={{ color: 'rgba(240, 236, 224, 0.6)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f0ece0'; e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240, 236, 224, 0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Language switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="md:hidden">
              <CompactLanguageSwitcher />
            </div>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => { setUserMenuOpen(!userMenuOpen); setLangMenuOpen(false); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[90px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className={cn('absolute top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl py-1 z-50', dir === 'rtl' ? 'left-0' : 'right-0')}>
                      <div className="px-4 py-2.5 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {[
                        { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
                        { href: '/studio', icon: Video, label: t('nav.studio') },
                        ...(isAdmin(user.role) ? [{ href: '/admin', icon: Shield, label: t('nav.admin') }] : []),
                      ].map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors arabic-text">
                          <Icon className="w-4 h-4 text-muted-foreground" />{label}
                        </Link>
                      ))}
                      <hr className="my-1 border-border" />
                      <button onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors arabic-text">
                        <LogOut className="w-4 h-4" />{t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium hover:text-primary-600 transition-colors arabic-text">
                  {t('nav.login')}
                </Link>
                <Link href="/auth/register" className="btn-primary !px-4 !py-2 !text-sm arabic-text">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border shadow-xl overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ key, href }) => (
                <Link key={key} href={href}
                  className={cn('block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors arabic-text', pathname === href ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600' : 'hover:bg-muted')}>
                  {t(key)}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/auth/login" className="block text-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors arabic-text">
                    {t('nav.login')}
                  </Link>
                  <Link href="/auth/register" className="btn-primary text-center text-sm arabic-text">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
