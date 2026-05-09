import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import ForumClient from '@/components/forum/ForumClient';

export const metadata: Metadata = { title: 'منتدى المجتمع' };

export default function ForumPage() {
  return (
    <MainLayout>
      <ForumClient />
    </MainLayout>
  );
}
