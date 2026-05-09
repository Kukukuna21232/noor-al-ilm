import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import PrayerWidget from '@/components/home/PrayerWidget';
import QuranCarousel from '@/components/home/QuranCarousel';
import FeaturedCourses from '@/components/home/FeaturedCourses';
import FeaturedTeachers from '@/components/home/FeaturedTeachers';
import AIImamPreview from '@/components/home/AIImamPreview';
import LatestVideos from '@/components/home/LatestVideos';
import LatestDiscussions from '@/components/home/LatestDiscussions';
import IslamicCalendar from '@/components/home/IslamicCalendar';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTASection from '@/components/home/CTASection';

export const metadata: Metadata = {
  title: 'نور العلم — المنصة التعليمية الإسلامية العالمية',
  description: 'تعلم القرآن الكريم، واستكشف العلوم الإسلامية، وتواصل مع المجتمع الإسلامي العالمي',
};

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
      <QuranCarousel />
      <FeaturesSection />
      <PrayerWidget />
      <FeaturedCourses />
      <AIImamPreview />
      <LatestVideos />
      <FeaturedTeachers />
      <LatestDiscussions />
      <IslamicCalendar />
      <TestimonialsSection />
      <CTASection />
    </MainLayout>
  );
}
