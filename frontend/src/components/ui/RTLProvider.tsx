'use client';
import { useEffect, ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';

interface RTLProviderProps {
  children: ReactNode;
}

export function RTLProvider({ children }: RTLProviderProps) {
  const { locale, dir } = useI18n();

  useEffect(() => {
    // Update document direction
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;

    // Add RTL-specific CSS classes
    if (dir === 'rtl') {
      document.body.classList.add('rtl-layout');
      document.body.classList.remove('ltr-layout');
    } else {
      document.body.classList.add('ltr-layout');
      document.body.classList.remove('rtl-layout');
    }

    // Update meta tags for SEO
    const htmlLang = document.querySelector('html');
    if (htmlLang) {
      htmlLang.setAttribute('lang', locale);
      htmlLang.setAttribute('dir', dir);
    }

    // Add RTL-specific font classes
    if (dir === 'rtl') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [locale, dir]);

  return <>{children}</>;
}

// RTL-aware component wrapper
export function RTLWrapper({ children, className = '' }: { 
  children: ReactNode; 
  className?: string;
}) {
  const { dir } = useI18n();

  return (
    <div 
      className={`rtl-wrapper ${className}`}
      style={{ direction: dir }}
    >
      {children}
    </div>
  );
}

// Hook for RTL-specific utilities
export function useRTL() {
  const { locale, dir } = useI18n();
  
  const isRTL = dir === 'rtl';
  const isArabic = locale === 'ar';
  const isRussian = locale === 'ru';

  const getMarginClass = (base: string) => {
    if (isRTL) {
      return base.replace(/left/g, 'right').replace(/Left/g, 'Right');
    }
    return base;
  };

  const getPaddingClass = (base: string) => {
    if (isRTL) {
      return base.replace(/pl-/g, 'pr-').replace(/pr-/g, 'pl-');
    }
    return base;
  };

  const getFlexDirection = () => {
    return isRTL ? 'row-reverse' : 'row';
  };

  const getTextAlign = () => {
    return isRTL ? 'right' : 'left';
  };

  return {
    isRTL,
    isArabic,
    isRussian,
    dir,
    locale,
    getMarginClass,
    getPaddingClass,
    getFlexDirection,
    getTextAlign,
  };
}
