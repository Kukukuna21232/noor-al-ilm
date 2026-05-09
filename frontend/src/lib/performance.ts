// Performance optimization utilities for global use

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.metrics.fcp = fcp.startTime;
        this.reportMetric('FCP', fcp.startTime);
      }
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      if (lcp) {
        this.metrics.lcp = lcp.startTime;
        this.reportMetric('LCP', lcp.startTime);
      }
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0];
      if (fid) {
        this.metrics.fid = fid.processingStart - fid.startTime;
        this.reportMetric('FID', this.metrics.fid);
      }
    });

    // Cumulative Layout Shift
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.metrics.cls = clsValue;
      this.reportMetric('CLS', clsValue);
    });

    // Time to First Byte
    this.observeNavigation();
  }

  private observePerformanceEntry(type: string, callback: (entries: any[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error);
    }
  }

  private observeNavigation(): void {
    if ('navigation' in performance) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
      }
    }
  }

  private reportMetric(name: string, value: number): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'web_vitals', {
        name,
        value: Math.round(value),
        event_category: 'Performance'
      });
    }

    // Log to console in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image optimization utilities
export class ImageOptimizer {
  static async optimizeImage(src: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'auto';
  }): Promise<string> {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'auto'
    } = options || {};

    // Check if browser supports modern formats
    const supportsWebp = this.supportsFormat('webp');
    const supportsAvif = this.supportsFormat('avif');

    let imageFormat = format;
    if (format === 'auto') {
      if (supportsAvif) imageFormat = 'avif';
      else if (supportsWebp) imageFormat = 'webp';
      else imageFormat = 'jpeg';
    }

    // Build optimized URL (assuming CDN with image transformation)
    const baseUrl = src.startsWith('http') ? src : `${window.location.origin}${src}`;
    const optimizedUrl = `${baseUrl}?w=${width}&h=${height}&q=${quality}&f=${imageFormat}`;

    return optimizedUrl;
  }

  private static supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    canvas.width = 1;
    canvas.height = 1;

    if (format === 'webp') {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } else if (format === 'avif') {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }

    return false;
  }

  static lazyLoadImage(img: HTMLImageElement, src: string): void {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      img.classList.add('lazy');
      observer.observe(img);
    } else {
      // Fallback for older browsers
      img.src = src;
    }
  }
}

// Network optimization utilities
export class NetworkOptimizer {
  static async prefetchResources(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => resolve(); // Still resolve on error
        document.head.appendChild(link);
      });
    });

    await Promise.all(promises);
  }

  static async preloadCriticalResources(resources: Array<{
    url: string;
    as: 'script' | 'style' | 'image' | 'font';
  }>): Promise<void> {
    const promises = resources.map(resource => {
      return new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = resource.as;
        
        if (resource.as === 'font') {
          link.crossOrigin = 'anonymous';
        }
        
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
      });
    });

    await Promise.all(promises);
  }

  static getNetworkType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  static isSlowConnection(): boolean {
    const networkType = this.getNetworkType();
    return networkType === 'slow-2g' || networkType === '2g';
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static cleanupCallbacks: (() => void)[] = [];

  static addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  static cleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
    this.cleanupCallbacks = [];
  }

  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Initialize performance monitoring
export function initializePerformanceOptimization(): void {
  if (typeof window !== 'undefined') {
    // Start performance monitoring
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();

    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
      monitor.stopMonitoring();
      MemoryOptimizer.cleanup();
    });

    // Optimize based on network conditions
    if (NetworkOptimizer.isSlowConnection()) {
      document.body.classList.add('slow-connection');
    }

    // Report initial metrics
    setTimeout(() => {
      const metrics = monitor.getMetrics();
      console.log('Initial Performance Metrics:', metrics);
    }, 5000);
  }
}
