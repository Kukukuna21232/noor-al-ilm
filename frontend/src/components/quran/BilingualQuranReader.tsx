'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useRTL } from '@/components/ui/RTLProvider';

interface QuranVerse {
  id: number;
  surah: number;
  ayah: number;
  arabicText: string;
  russianTranslation: string;
  transliteration: string;
}

interface QuranSurah {
  id: number;
  name: string;
  arabicName: string;
  russianName: string;
  verses: QuranVerse[];
}

const sampleQuranData: QuranSurah[] = [
  {
    id: 1,
    name: 'Al-Fatiha',
    arabicName: 'الفاتحة',
    russianName: 'Открывающая',
    verses: [
      {
        id: 1,
        surah: 1,
        ayah: 1,
        arabicText: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
        russianTranslation: 'Во имя Аллаха, Милостивого, Милостивейшего',
        transliteration: 'Bismillah ir-Rahman ir-Rahim'
      },
      {
        id: 2,
        surah: 1,
        ayah: 2,
        arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        russianTranslation: 'Хвала Аллаху, Господу миров',
        transliteration: 'Alhamdulillahi Rabbil \'alamin'
      },
      {
        id: 3,
        surah: 1,
        ayah: 3,
        arabicText: 'الرَّحْمَنِ الرَّحِيمِ',
        russianTranslation: 'Милостивому, Милостивейшему',
        transliteration: 'Ar-Rahman ir-Rahim'
      },
      {
        id: 4,
        surah: 1,
        ayah: 4,
        arabicText: 'مَالِكِ يَوْمِ الدِّينِ',
        russianTranslation: 'Властелину Дня воздаяния',
        transliteration: 'Maliki yawmid-din'
      },
      {
        id: 5,
        surah: 1,
        ayah: 5,
        arabicText: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        russianTranslation: 'Тебе мы поклоняемся и Тебя молим о помощи',
        transliteration: 'Iyyaka na\'budu wa iyyaka nasta\'in'
      },
      {
        id: 6,
        surah: 1,
        ayah: 6,
        arabicText: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        russianTranslation: 'Веди нас прямым путем',
        transliteration: 'Ihdinas-siratal-mustaqim'
      },
      {
        id: 7,
        surah: 1,
        ayah: 7,
        arabicText: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        russianTranslation: 'Путем тех, кого Ты облагодетельствовал, не тех, на которых пал гнев, и не заблудших',
        transliteration: 'Siratal-ladhina an\'amta \'alayhim ghayril-maghdubi \'alayhim wa-la-d-dallin'
      }
    ]
  },
  {
    id: 112,
    name: 'Al-Ikhlas',
    arabicName: 'الإخلاص',
    russianName: 'Очищение',
    verses: [
      {
        id: 1,
        surah: 112,
        ayah: 1,
        arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        russianTranslation: 'Скажи: «Он – Аллах Единый',
        transliteration: 'Qul huwallahu ahad'
      },
      {
        id: 2,
        surah: 112,
        ayah: 2,
        arabicText: 'اللَّهُ الصَّمَدُ',
        russianTranslation: 'Аллах Самодостаточный',
        transliteration: 'Allahus-samad'
      },
      {
        id: 3,
        surah: 112,
        ayah: 3,
        arabicText: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        russianTranslation: 'Он не родил и не был рожден',
        transliteration: 'Lam yalid wa lam yulad'
      },
      {
        id: 4,
        surah: 112,
        ayah: 4,
        arabicText: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        russianTranslation: 'И нет никого, равного Ему',
        transliteration: 'Wa lam yakun lahu kufuwan ahad'
      }
    ]
  }
];

export function BilingualQuranReader() {
  const { locale, t } = useI18n();
  const { isRTL, isArabic, isRussian } = useRTL();
  const [selectedSurah, setSelectedSurah] = useState<QuranSurah>(sampleQuranData[0]);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  const fontSizeClass = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    extraLarge: 'text-3xl'
  };

  const arabicFontSizeClass = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    extraLarge: 'text-4xl'
  };

  useEffect(() => {
    // Auto-adjust font size based on language
    if (isArabic) {
      setFontSize('large');
    } else if (isRussian) {
      setFontSize('medium');
    }
  }, [locale]);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl-layout' : 'ltr-layout'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('quran.title')}
        </h1>
        <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('quran.subtitle')}
        </p>
      </div>

      {/* Controls */}
      <div className={`mb-6 flex flex-wrap gap-4 ${isRTL ? 'justify-end' : 'justify-start'}`}>
        {/* Surah Selector */}
        <select
          value={selectedSurah.id}
          onChange={(e) => {
            const surah = sampleQuranData.find(s => s.id === parseInt(e.target.value));
            if (surah) setSelectedSurah(surah);
          }}
          className={`px-4 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
        >
          {sampleQuranData.map((surah) => (
            <option key={surah.id} value={surah.id}>
              {isArabic ? surah.arabicName : isRussian ? surah.russianName : surah.name}
            </option>
          ))}
        </select>

        {/* Display Options */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-4 py-2 rounded-lg ${
              showTranslation
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {t('quran.translation')}
          </button>
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className={`px-4 py-2 rounded-lg ${
              showTransliteration
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {isArabic ? 'التجليد' : isRussian ? 'Транслитерация' : 'Transliteration'}
          </button>
        </div>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className={`px-4 py-2 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
        >
          <option value="small">
            {isArabic ? 'صغير' : isRussian ? 'Маленький' : 'Small'}
          </option>
          <option value="medium">
            {isArabic ? 'متوسط' : isRussian ? 'Средний' : 'Medium'}
          </option>
          <option value="large">
            {isArabic ? 'كبير' : isRussian ? 'Большой' : 'Large'}
          </option>
          <option value="extraLarge">
            {isArabic ? 'كبير جداً' : isRussian ? 'Очень большой' : 'Extra Large'}
          </option>
        </select>
      </div>

      {/* Surah Title */}
      <div className="mb-8 text-center">
        <h2 className={`text-2xl font-bold mb-2 ${arabicFontSizeClass[fontSize as keyof typeof arabicFontSizeClass]}`}>
          {isArabic ? selectedSurah.arabicName : selectedSurah.name}
        </h2>
        {isRussian && (
          <p className="text-lg text-gray-600">{selectedSurah.russianName}</p>
        )}
      </div>

      {/* Verses */}
      <div className="space-y-6">
        {selectedSurah.verses.map((verse) => (
          <div
            key={verse.id}
            className={`p-6 bg-white rounded-lg shadow-sm border ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            {/* Verse Number */}
            <div className={`mb-4 text-sm text-gray-500 ${isRTL ? 'text-left' : 'text-right'}`}>
              {isArabic ? 'آية' : isRussian ? 'Аят' : 'Verse'} {verse.ayah}
            </div>

            {/* Arabic Text */}
            <div className={`mb-4 ${arabicFontSizeClass[fontSize as keyof typeof arabicFontSizeClass]} font-arabic text-justify leading-loose`}>
              {verse.arabicText}
            </div>

            {/* Transliteration */}
            {showTransliteration && (
              <div className={`mb-4 text-gray-600 italic ${fontSizeClass[fontSize as keyof typeof fontSizeClass]}`}>
                {verse.transliteration}
              </div>
            )}

            {/* Russian Translation */}
            {showTranslation && (
              <div className={`${fontSizeClass[fontSize as keyof typeof fontSizeClass]} text-gray-700 leading-relaxed`}>
                <span className="text-sm text-gray-500">
                  {isArabic ? 'ترجمة:' : isRussian ? 'Перевод:' : 'Translation:'}
                </span>
                <br />
                {verse.russianTranslation}
              </div>
            )}

            {/* Actions */}
            <div className={`mt-4 flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  isRTL ? 'ml-2' : 'mr-2'
                } bg-secondary hover:bg-secondary/80`}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${verse.arabicText}\n\n${verse.russianTranslation}`
                  );
                }}
              >
                {t('common.copy')}
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  isRTL ? 'ml-2' : 'mr-2'
                } bg-secondary hover:bg-secondary/80`}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Quran ${selectedSurah.name}:${verse.ayah}`,
                      text: `${verse.arabicText}\n\n${verse.russianTranslation}`,
                    });
                  }
                }}
              >
                {t('common.share')}
              </button>
              <button
                className={`px-3 py-1 text-sm rounded ${
                  isRTL ? 'ml-2' : 'mr-2'
                } bg-secondary hover:bg-secondary/80`}
              >
                {t('quran.bookmark')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`mt-8 text-center text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p>
          {isArabic 
            ? 'صدق الله العظيم' 
            : isRussian 
            ? 'Сказал Аллах Великий и Всемогущий' 
            : 'Allah has spoken the truth'
          }
        </p>
      </div>
    </div>
  );
}

// Quran Navigation Component
export function QuranNavigation() {
  const { t, isRTL } = useI18n();
  
  const navigationItems = [
    { key: 'quran.tajweed', label: t('quran.tajweed') },
    { key: 'quran.memorization', label: t('quran.memorization') },
    { key: 'quran.recitation', label: t('quran.recitation') },
    { key: 'quran.progress', label: t('quran.progress') },
  ];

  return (
    <div className={`flex flex-wrap gap-4 mb-6 ${isRTL ? 'justify-end' : 'justify-start'}`}>
      {navigationItems.map((item) => (
        <button
          key={item.key}
          className={`px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 ${
            isRTL ? 'ml-2' : 'mr-2'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
