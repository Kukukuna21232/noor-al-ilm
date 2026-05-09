import type { Metadata } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'لوحة التحكم' };

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardClient />
    </MainLayout>
  );
}
