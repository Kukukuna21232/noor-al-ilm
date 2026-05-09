'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <>
      {children}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 z-50 bg-emerald-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Install Noor Al-Ilm</h3>
              <p className="text-sm opacity-90">Get our app for better experience</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsInstallable(false)}
                className="px-3 py-1 text-sm bg-emerald-700 rounded hover:bg-emerald-800"
              >
                Later
              </button>
              <button
                onClick={installApp}
                className="px-3 py-1 text-sm bg-white text-emerald-600 rounded hover:bg-gray-100"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
