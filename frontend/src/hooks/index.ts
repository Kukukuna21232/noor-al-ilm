'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

// ── useDebounce ───────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── useLocalStorage ───────────────────────────────────────
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initial; }
    catch { return initial; }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);
  return [value, set] as const;
}

// ── useMediaQuery ─────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ── useScrollPosition ─────────────────────────────────────
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrollY;
}

// ── useIntersectionObserver ───────────────────────────────
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const optionsRef = useRef(options);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.1, ...optionsRef.current });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

// ── useAuth ───────────────────────────────────────────────
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, register, fetchMe } = useAuthStore();
  return { user, isAuthenticated, isLoading, login, logout, register, fetchMe };
}

// ── useRequireAuth ────────────────────────────────────────
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuthStore();
  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);
  return { isAuthenticated, isLoading };
}

// ── useClickOutside ───────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
}

// ── useCopyToClipboard ────────────────────────────────────
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, []);
  return { copied, copy };
}

// ── useCountUp ────────────────────────────────────────────
export function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}
