import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (n: number, locale = 'ar-SA'): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(locale);
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
};

export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const getInitials = (name: string): string =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

export const isRTLText = (text: string): boolean => {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(text);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const CATEGORY_COLORS: Record<string, string> = {
  quranStudies: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  arabic:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  history:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  culture:      'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
  fiqh:         'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  aqeedah:      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  general:      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  quran:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'مدير عام', admin: 'مدير', moderator: 'مشرف',
  scholar: 'عالم', teacher: 'معلم', student: 'طالب', user: 'مستخدم',
};

export const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin:      'bg-red-100 text-red-700',
  moderator:  'bg-blue-100 text-blue-700',
  scholar:    'bg-gold-100 text-gold-700',
  teacher:    'bg-green-100 text-green-700',
  student:    'bg-purple-100 text-purple-700',
  user:       'bg-gray-100 text-gray-700',
};
