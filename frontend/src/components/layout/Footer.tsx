'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Facebook, Twitter, Youtube, Instagram, Send } from 'lucide-react';

const FOOTER_LINKS = {
  learn: [
    { label: 'تعلم القرآن', href: '/quran' },
    { label: 'الدورات', href: '/courses' },
    { label: 'اسأل الإمام', href: '/ask-imam' },
    { label: 'المكتبة', href: '/media' },
    { label: 'الفيديوهات', href: '/watch' },
  ],
  community: [
    { label: 'المنتدى', href: '/forum' },
    { label: 'البث المباشر', href: '/live' },
    { label: 'المعلمون', href: '/teachers' },
    { label: 'الاستوديو', href: '/studio' },
  ],
  support: [
    { label: 'من نحن', href: '/about' },
    { label: 'اتصل بنا', href: '/contact' },
    { label: 'سياسة الخصوصية', href: '/privacy' },
    { label: 'شروط الاستخدام', href: '/terms' },
  ],
};

const SOCIALS = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Send, href: '#', label: 'Telegram' },
];

export default function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer style={{ backgroundColor: '#131c2e', borderTop: '0.5px solid rgba(201, 168, 76, 0.15)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1a6b3c' }}>
                <span className="text-2xl arabic-text font-bold" style={{ color: '#f0ece0' }}>ن</span>
              </div>
              <div>
                <p className="font-bold text-xl arabic-text" style={{ color: '#c9a84c' }}>نور العلم</p>
                <p className="text-xs" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>Noor Al-Ilm</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed arabic-text mb-5 max-w-xs" style={{ color: 'rgba(240, 236, 224, 0.6)' }}>
              منصة تعليمية إسلامية شاملة تجمع المسلمين من حول العالم للتعلم والتواصل والنمو الروحي
            </p>
            {/* Newsletter */}
            <div className="flex gap-2">
              <input type="email" placeholder={locale === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ 
                  backgroundColor: '#0c1220', 
                  border: '0.5px solid rgba(201, 168, 76, 0.15)',
                  color: '#f0ece0'
                }} />
              <button className="px-4 py-2 rounded-lg text-sm font-medium arabic-text transition-colors"
                style={{ backgroundColor: '#1a6b3c', color: '#f0ece0' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#145a32'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a6b3c'; }}>
                {locale === 'ar' ? 'اشتراك' : 'Subscribe'}
              </button>
            </div>
            {/* Socials */}
            <div className="flex gap-3 mt-5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(26, 107, 60, 0.2)', color: 'rgba(240, 236, 224, 0.7)' }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.backgroundColor = 'rgba(26, 107, 60, 0.3)'; 
                    e.currentTarget.style.color = '#f0ece0'; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.backgroundColor = 'rgba(26, 107, 60, 0.2)'; 
                    e.currentTarget.style.color = 'rgba(240, 236, 224, 0.7)'; 
                  }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'التعلم', links: FOOTER_LINKS.learn },
            { title: 'المجتمع', links: FOOTER_LINKS.community },
            { title: 'الدعم', links: FOOTER_LINKS.support },
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="font-bold mb-4 arabic-text" style={{ color: '#c9a84c' }}>{title}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm transition-colors arabic-text"
                      style={{ color: 'rgba(240, 236, 224, 0.6)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f0ece0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240, 236, 224, 0.6)'; }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '0.5px solid rgba(201, 168, 76, 0.15)' }} className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm arabic-text" style={{ color: 'rgba(240, 236, 224, 0.5)' }}>
            © {new Date().getFullYear()} نور العلم. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(240, 236, 224, 0.4)' }}>
            <span>Built with ❤️ for the Muslim Ummah</span>
            <span>•</span>
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
