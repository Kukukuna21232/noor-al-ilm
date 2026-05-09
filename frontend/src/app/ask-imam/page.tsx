import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import AIChat from '@/components/ai/AIChat';

export const metadata: Metadata = { title: 'اسأل الإمام — مساعد ذكاء اصطناعي إسلامي' };

export default function AskImamPage() {
  return (
    <MainLayout hideFooter>
      <AIChat />
    </MainLayout>
  );
}
