/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['localhost', 'api.noor-al-ilm.com', 'cdn.noor-al-ilm.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  // Internationalization
  i18n: {
    locales: ['ar', 'ru', 'en'],
    defaultLocale: 'ar',
    domains: [
      {
        domain: 'ar.noor-al-ilm.com',
        defaultLocale: 'ar',
      },
      {
        domain: 'ru.noor-al-ilm.com',
        defaultLocale: 'ru',
      },
      {
        domain: 'en.noor-al-ilm.com',
        defaultLocale: 'en',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
