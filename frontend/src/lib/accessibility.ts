// WCAG 2.1 AA compliance and accessibility features for global users

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  language: string;
  textDirection: 'ltr' | 'rtl';
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings = {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    focusVisible: true,
    colorBlindness: 'none',
    language: 'en',
    textDirection: 'ltr'
  };

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  constructor() {
    this.loadSettings();
    this.detectSystemPreferences();
    this.applySettings();
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        } catch (error) {
          console.warn('Failed to load accessibility settings:', error);
        }
      }
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    }
  }

  private detectSystemPreferences(): void {
    if (typeof window !== 'undefined') {
      // Detect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.settings.reducedMotion = true;
      }

      // Detect high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        this.settings.highContrast = true;
      }

      // Detect screen reader
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) {
        this.settings.screenReader = true;
      }

      // Detect keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          this.settings.keyboardNavigation = true;
          document.body.classList.add('keyboard-navigation');
          window.removeEventListener('keydown', handleKeyDown);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Detect mouse usage
      const handleMouseDown = () => {
        this.settings.keyboardNavigation = false;
        document.body.classList.remove('keyboard-navigation');
        window.removeEventListener('mousedown', handleMouseDown);
      };
      window.addEventListener('mousedown', handleMouseDown);
    }
  }

  private applySettings(): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Apply font size
      root.style.setProperty('--font-size-multiplier', this.getFontSizeMultiplier());

      // Apply high contrast
      root.classList.toggle('high-contrast', this.settings.highContrast);

      // Apply reduced motion
      root.classList.toggle('reduced-motion', this.settings.reducedMotion);

      // Apply screen reader optimizations
      root.classList.toggle('screen-reader', this.settings.screenReader);

      // Apply keyboard navigation
      root.classList.toggle('keyboard-navigation', this.settings.keyboardNavigation);

      // Apply focus visibility
      root.classList.toggle('focus-visible', this.settings.focusVisible);

      // Apply color blindness filters
      this.applyColorBlindnessFilter();

      // Apply text direction
      root.dir = this.settings.textDirection;
      root.lang = this.settings.language;

      // Add ARIA live regions for screen readers
      this.setupAriaLiveRegions();
    }
  }

  private getFontSizeMultiplier(): string {
    const multipliers = {
      small: '0.875',
      medium: '1',
      large: '1.125',
      'extra-large': '1.25'
    };
    return multipliers[this.settings.fontSize];
  }

  private applyColorBlindnessFilter(): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Remove existing filters
      root.style.removeProperty('--color-blindness-filter');

      // Apply new filter
      const filters = {
        protanopia: 'url(#protanopia-filter)',
        deuteranopia: 'url(#deuteranopia-filter)',
        tritanopia: 'url(#tritanopia-filter)',
        none: 'none'
      };
      
      root.style.setProperty('--color-blindness-filter', filters[this.settings.colorBlindness]);
    }
  }

  private setupAriaLiveRegions(): void {
    if (typeof document !== 'undefined' && this.settings.screenReader) {
      // Create aria-live region for announcements
      let liveRegion = document.getElementById('aria-live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }
    }
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applySettings();
    this.announceChanges(newSettings);
  }

  private announceChanges(changes: Partial<AccessibilitySettings>): void {
    if (this.settings.screenReader && typeof document !== 'undefined') {
      const liveRegion = document.getElementById('aria-live-region');
      if (liveRegion) {
        const messages = [];
        
        if (changes.fontSize) {
          messages.push(`Font size changed to ${changes.fontSize}`);
        }
        if (changes.highContrast !== undefined) {
          messages.push(`High contrast ${changes.highContrast ? 'enabled' : 'disabled'}`);
        }
        if (changes.reducedMotion !== undefined) {
          messages.push(`Reduced motion ${changes.reducedMotion ? 'enabled' : 'disabled'}`);
        }
        
        liveRegion.textContent = messages.join('. ');
      }
    }
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // WCAG 2.1 AA compliance helpers
  static checkColorContrast(foreground: string, background: string): number {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return 0;

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);

    // Calculate contrast ratio
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  static validateWCAGCompliance(element: HTMLElement): {
    passes: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for alt text on images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt) {
        issues.push('Image missing alt text');
        suggestions.push('Add descriptive alt text to all images');
      }
    });

    // Check for proper heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading level skipped: h${lastLevel} to h${level}`);
        suggestions.push('Maintain proper heading hierarchy');
      }
      lastLevel = level;
    });

    // Check for form labels
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const hasLabel = element.querySelector(`label[for="${input.id}"]`) || 
                      input.getAttribute('aria-label') ||
                      input.getAttribute('aria-labelledby');
      if (!hasLabel) {
        issues.push('Form input missing label');
        suggestions.push('Add labels to all form inputs');
      }
    });

    // Check for focus indicators
    const focusableElements = element.querySelectorAll('a, button, input, textarea, select');
    const hasFocusStyles = Array.from(focusableElements).some(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    if (!hasFocusStyles) {
      issues.push('No visible focus indicators');
      suggestions.push('Add visible focus styles for keyboard navigation');
    }

    // Check for sufficient color contrast (simplified)
    const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a');
    textElements.forEach(textEl => {
      const styles = window.getComputedStyle(textEl);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        // This is a simplified check - in practice, you'd need to convert colors properly
        const contrast = this.checkColorContrast(color, bgColor);
        if (contrast < 4.5) {
          issues.push('Insufficient color contrast');
          suggestions.push('Ensure text contrast ratio is at least 4.5:1');
        }
      }
    });

    return {
      passes: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Screen reader utilities
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof document !== 'undefined') {
      let liveRegion = document.getElementById(`aria-live-${priority}`);
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = `aria-live-${priority}`;
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }
      
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Keyboard navigation utilities
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Text-to-speech utilities
  static speakText(text: string, options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (options?.lang) utterance.lang = options.lang;
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      if (options?.volume) utterance.volume = options.volume;
      
      window.speechSynthesis.speak(utterance);
    }
  }

  // Visual impairment helpers
  static generateHighContrastTheme(): Record<string, string> {
    return {
      '--background': '#000000',
      '--foreground': '#ffffff',
      '--primary': '#ffff00',
      '--secondary': '#00ffff',
      '--accent': '#ff00ff',
      '--border': '#ffffff',
      '--muted': '#808080',
      '--muted-foreground': '#c0c0c0',
    };
  }

  static generateColorBlindFilters(): string {
    return `
      <svg style="position: absolute; width: 0; height: 0;">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0, 0, 0
              0.558, 0.442, 0, 0, 0
              0, 0.242, 0.758, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0, 0, 0
              0.7, 0.3, 0, 0, 0
              0, 0.3, 0.7, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="
              0.95, 0.05, 0, 0, 0
              0, 0.433, 0.567, 0, 0
              0, 0.475, 0.525, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
        </defs>
      </svg>
    `;
  }
}

// React hook for accessibility
export function useAccessibility() {
  const service = AccessibilityService.getInstance();
  
  return {
    settings: service.getSettings(),
    updateSettings: service.updateSettings.bind(service),
    announce: AccessibilityService.announceToScreenReader,
    speak: AccessibilityService.speakText,
    validateWCAG: AccessibilityService.validateWCAGCompliance,
    trapFocus: AccessibilityService.trapFocus
  };
}

// CSS utility classes for accessibility
export const accessibilityStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .focus-visible :focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .high-contrast {
    --background: #000000;
    --foreground: #ffffff;
    --primary: #ffff00;
    --secondary: #00ffff;
    --accent: #ff00ff;
    --border: #ffffff;
  }

  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .keyboard-navigation *:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }

  .color-blind-filter {
    filter: var(--color-blindness-filter, none);
  }

  .font-size-small {
    font-size: 0.875em;
  }

  .font-size-medium {
    font-size: 1em;
  }

  .font-size-large {
    font-size: 1.125em;
  }

  .font-size-extra-large {
    font-size: 1.25em;
  }
`;
