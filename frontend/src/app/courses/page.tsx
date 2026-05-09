import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import CoursesClient from '@/components/courses/CoursesClient';

export const metadata: Metadata = { title: 'الدورات التعليمية' };

export default function CoursesPage() {
  return (
    <MainLayout>
      <CoursesClient />
    </MainLayout>
  );
}
