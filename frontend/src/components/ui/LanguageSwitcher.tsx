'use client';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'ar', name: 'العربية', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
];

export function LanguageSwitcher() {
  const { locale, setLocale, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as any);
    setIsOpen(false);
    
    // Store preference
    localStorage.setItem('preferred-language', newLocale);
    
    // Update document direction
    document.documentElement.dir = languages.find(lang => lang.code === newLocale)?.dir || 'ltr';
    document.documentElement.lang = newLocale;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium">{currentLanguage.nativeName}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={dir === 'rtl' ? 'start' : 'end'}
        className="min-w-[160px]"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              locale === language.code ? 'bg-accent' : ''
            }`}
          >
            <span className={`font-medium ${language.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {language.nativeName}
            </span>
            {locale === language.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function CompactLanguageSwitcher() {
  const { locale, setLocale, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale as any);
    setIsOpen(false);
    
    // Store preference
    localStorage.setItem('preferred-language', newLocale);
    
    // Update document direction
    document.documentElement.dir = languages.find(lang => lang.code === newLocale)?.dir || 'ltr';
    document.documentElement.lang = newLocale;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={dir === 'rtl' ? 'start' : 'end'}
        className="min-w-[140px]"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              locale === language.code ? 'bg-accent' : ''
            }`}
          >
            <span className={`text-sm ${language.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {language.nativeName}
            </span>
            {locale === language.code && (
              <span className="text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Language toggle for Arabic/Russian only
export function ArabicRussianToggle() {
  const { locale, setLocale, dir } = useI18n();
  
  const isArabic = locale === 'ar';
  const isRussian = locale === 'ru';

  const toggleLanguage = () => {
    const newLocale = isArabic ? 'ru' : 'ar';
    setLocale(newLocale as any);
    
    // Store preference
    localStorage.setItem('preferred-language', newLocale);
    
    // Update document direction
    const newDir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = newDir;
    document.documentElement.lang = newLocale;
  };

  if (!isArabic && !isRussian) {
    return null; // Don't show if current language is neither Arabic nor Russian
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
      aria-label={`Switch to ${isArabic ? 'Russian' : 'Arabic'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {isArabic ? 'Русский' : 'العربية'}
      </span>
    </Button>
  );
}
