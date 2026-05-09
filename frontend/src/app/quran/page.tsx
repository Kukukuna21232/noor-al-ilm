import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import { BilingualQuranReader } from '@/components/quran/BilingualQuranReader';
import { QuranNavigation } from '@/components/quran/BilingualQuranReader';

export const metadata: Metadata = { 
  title: 'تعلم القرآن الكريم | Learn Quran',
  description: 'Read and study the Holy Quran with Arabic text and Russian translations'
};

export default function QuranPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <QuranNavigation />
        <BilingualQuranReader />
      </div>
    </MainLayout>
  );
}
