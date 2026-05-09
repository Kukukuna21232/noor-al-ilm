import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/components/providers/QueryProvider';
import { I18nProvider } from '@/lib/i18n';
import { RTLProvider } from '@/components/ui/RTLProvider';
import '@/styles/globals.css';
import '@/styles/rtl.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://noor-al-ilm.com'),
  title: {
    default: 'نور العلم | Noor Al-Ilm — Islamic Educational Ecosystem',
    template: '%s | نور العلم',
  },
  description: 'منصة تعليمية إسلامية شاملة — Comprehensive Islamic Educational Platform with AI Imam, Quran Learning, Courses, and Community',
  keywords: ['Islamic education', 'Quran learning', 'Arabic', 'Islam', 'AI Imam', 'تعلم القرآن', 'نور العلم'],
  authors: [{ name: 'Noor Al-Ilm Team' }],
  creator: 'Noor Al-Ilm',
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: ['ru_RU', 'en_US'],
    siteName: 'نور العلم',
    title: 'نور العلم — Islamic Educational Ecosystem',
    description: 'منصة تعليمية إسلامية شاملة',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نور العلم — Islamic Educational Ecosystem',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1923' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri+Quran:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <I18nProvider>
              <RTLProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgb(var(--card))',
                      color: 'rgb(var(--card-foreground))',
                      border: '1px solid rgb(var(--border))',
                      borderRadius: '12px',
                      fontFamily: 'Amiri, Inter, sans-serif',
                    },
                    success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
                  }}
                />
              </RTLProvider>
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
