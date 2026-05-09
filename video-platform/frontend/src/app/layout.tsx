import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'نور العلم - منصة الفيديو', template: '%s | نور العلم' },
  description: 'منصة الفيديو التعليمي الإسلامي - Islamic Educational Video Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryProvider>
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
