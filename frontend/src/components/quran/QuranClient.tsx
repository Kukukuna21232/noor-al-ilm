'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Play, Pause, Volume2, ChevronRight, Star, CheckCircle, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { quranApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks';
import { Skeleton, Progress, Badge, EmptyState } from '@/components/ui';
import type { QuranSurah, QuranVerse } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'surahs' | 'progress' | 'search';

export default function QuranClient() {
  const { locale } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('surahs');
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data: surahsData, isLoading: surahsLoading } = useQuery({
    queryKey: ['quran-surahs'],
    queryFn: () => quranApi.getSurahs(),
    staleTime: Infinity,
  });

  const { data: versesData, isLoading: versesLoading } = useQuery({
    queryKey: ['quran-verses', selectedSurah?.id],
    queryFn: () => quranApi.getVerses(selectedSurah!.id, locale),
    enabled: !!selectedSurah,
    staleTime: Infinity,
  });

  const { data: searchData } = useQuery({
    queryKey: ['quran-search', debouncedSearch],
    queryFn: () => quranApi.search(debouncedSearch, locale),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: progressData } = useQuery({
    queryKey: ['quran-progress'],
    queryFn: () => quranApi.getProgress(),
    enabled: isAuthenticated,
  });

  const progressMutation = useMutation({
    mutationFn: (data: { surahId: number; verseId: string; progressType: string; status: string }) =>
      quranApi.updateProgress(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran-progress'] }),
  });

  const surahs: QuranSurah[] = (surahsData as { surahs?: QuranSurah[] })?.surahs || [];
  const verses: QuranVerse[] = (versesData as { verses?: QuranVerse[] })?.verses || [];
  const searchResults: QuranVerse[] = (searchData as { results?: QuranVerse[] })?.results || [];

  const TABS = [
    { key: 'surahs' as Tab, label_ar: 'السور', label_ru: 'Суры', icon: BookOpen },
    { key: 'search' as Tab, label_ar: 'بحث', label_ru: 'Поиск', icon: Search },
    ...(isAuthenticated ? [{ key: 'progress' as Tab, label_ar: 'تقدمي', label_ru: 'Прогресс', icon: BarChart3 }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-islamic-dark to-islamic-navy py-14 geometric-bg">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-gold-400 text-2xl arabic-text font-bold mb-3">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white arabic-text mb-3">
              {locale === 'ar' ? 'تعلم القرآن الكريم' : locale === 'ru' ? 'Изучение Священного Корана' : 'Learn the Holy Quran'}
            </h1>
            <p className="text-gray-400 arabic-text">
              {locale === 'ar' ? 'تلاوة، تجويد، حفظ، وتفسير' : 'Recitation, Tajweed, Memorization, and Tafsir'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border pb-4">
          {TABS.map(({ key, label_ar, label_ru, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all arabic-text ${activeTab === key ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}>
              <Icon className="w-4 h-4" />
              {locale === 'ar' ? label_ar : label_ru}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel */}
          <div className="lg:col-span-1">
            {activeTab === 'surahs' && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input placeholder={locale === 'ar' ? 'ابحث عن سورة...' : 'Search surah...'}
                      className="input-field pr-10 text-sm arabic-text" />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[600px] scrollbar-thin">
                  {surahsLoading ? (
                    <div className="p-4 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                  ) : (
                    surahs.map(surah => (
                      <button key={surah.id} onClick={() => setSelectedSurah(surah)}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0 ${selectedSurah?.id === surah.id ? 'bg-primary-50 dark:bg-primary-950/30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-islamic-green/20 to-primary-600/20 flex items-center justify-center text-xs font-bold text-primary-600">
                            {surah.id}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground arabic-text">{surah.nameArabic}</p>
                            <p className="text-xs text-muted-foreground">{surah.nameEnglish} • {surah.versesCount} آية</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={surah.revelationType === 'Meccan' ? 'primary' : 'blue'} className="text-xs">
                            {surah.revelationType === 'Meccan' ? (locale === 'ar' ? 'مكية' : 'Мекканская') : (locale === 'ar' ? 'مدنية' : 'Мединская')}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'ar' ? 'ابحث في القرآن...' : 'Search in Quran...'}
                    className="input-field pr-10 arabic-text" />
                </div>
                {searchResults.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {searchResults.map(verse => (
                      <div key={verse.id} className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                        <p className="text-sm arabic-text text-foreground mb-1">{verse.textArabic}</p>
                        <p className="text-xs text-muted-foreground">{locale === 'ru' ? verse.translationRu : verse.translationEn}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && isAuthenticated && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground arabic-text mb-4">
                  {locale === 'ar' ? 'تقدم الحفظ' : 'Memorization Progress'}
                </h3>
                <div className="space-y-3">
                  {[
                    { label_ar: 'الفاتحة', label_ru: 'Аль-Фатиха', progress: 100 },
                    { label_ar: 'الإخلاص', label_ru: 'Аль-Ихлас', progress: 100 },
                    { label_ar: 'الفلق', label_ru: 'Аль-Фалак', progress: 80 },
                    { label_ar: 'الناس', label_ru: 'Ан-Нас', progress: 60 },
                  ].map(item => (
                    <div key={item.label_ar}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="arabic-text text-foreground">{locale === 'ar' ? item.label_ar : item.label_ru}</span>
                        <span className="text-muted-foreground">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} showLabel={false} color={item.progress === 100 ? 'bg-green-500' : 'bg-primary-600'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — Verses */}
          <div className="lg:col-span-2">
            {selectedSurah ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Surah header */}
                <div className="bg-gradient-to-r from-islamic-dark to-islamic-navy p-6 text-center">
                  <p className="text-gold-400 text-3xl arabic-text font-bold mb-1">{selectedSurah.nameArabic}</p>
                  <p className="text-gray-400 text-sm">{selectedSurah.nameEnglish} • {selectedSurah.versesCount} {locale === 'ar' ? 'آية' : 'verses'}</p>
                  <p className="text-white text-xl arabic-text mt-3">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
                </div>

                {/* Verses */}
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto scrollbar-thin">
                  {versesLoading ? (
                    <div className="p-6 space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
                  ) : (
                    verses.map(verse => (
                      <motion.div key={verse.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="p-5 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xl arabic-text text-foreground leading-loose mb-2">{verse.textArabic}</p>
                            {locale !== 'ar' && (
                              <p className="text-sm text-muted-foreground italic">
                                {locale === 'ru' ? verse.translationRu : verse.translationEn}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center text-xs font-bold text-primary-600">
                              {verse.verseNumber}
                            </div>
                            {verse.audioUrl && (
                              <button onClick={() => setPlayingVerse(playingVerse === verse.id ? null : verse.id)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary-600">
                                {playingVerse === verse.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                            )}
                            {isAuthenticated && (
                              <button
                                onClick={() => progressMutation.mutate({ surahId: selectedSurah.id, verseId: verse.id, progressType: 'memorization', status: 'completed' })}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-green-600 opacity-0 group-hover:opacity-100">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title={locale === 'ar' ? 'اختر سورة للبدء' : locale === 'ru' ? 'Выберите суру для начала' : 'Select a surah to begin'}
                description={locale === 'ar' ? 'اختر سورة من القائمة على اليمين' : 'Choose a surah from the list'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
