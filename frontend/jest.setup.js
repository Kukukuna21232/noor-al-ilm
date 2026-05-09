// ═════════════════════════════════════════════════════════════════════════════
// NOOR AL-ILM JEST SETUP
// Version: 1.0.0
// Description: Jest setup file for testing configuration
// ═════════════════════════════════════════════════════════════════════════════

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './src/mocks/server';

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock getComputedStyle
global.getComputedStyle = jest.fn().mockImplementation(() => ({
  getPropertyValue: jest.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock window.alert
global.alert = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock window.prompt
global.prompt = jest.fn(() => '');

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn(() => new Uint32Array(1)),
  },
  writable: true,
});

// Mock File constructor
global.File = jest.fn((content, name, options) => ({
  name,
  size: content.length,
  type: options?.type || '',
  lastModified: Date.now(),
  arrayBuffer: jest.fn(),
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(),
}));

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  error: null,
  onload: null,
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock process.env
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://localhost:5000',
  NEXT_PUBLIC_WS_URL: 'ws://localhost:5000',
  NODE_ENV: 'test',
};

// Mock i18n
jest.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (key, fallback) => fallback || key,
    setLocale: jest.fn(),
  }),
  I18nProvider: ({ children }) => children,
}));

// Mock authentication
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

// Mock theme
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  }),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  ChevronDown: () => <div data-testid="chevron-down">ChevronDown</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  BookOpen: () => <div data-testid="book-icon">BookOpen</div>,
  Library: () => <div data-testid="library-icon">Library</div>,
  MessageCircle: () => <div data-testid="message-icon">MessageCircle</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  LayoutDashboard: () => <div data-testid="dashboard-icon">LayoutDashboard</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Video: () => <div data-testid="video-icon">Video</div>,
  Mic: () => <div data-testid="mic-icon">Mic</div>,
}));

// Mock React Hot Toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
    remove: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Setup MSW server
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

// Global test utilities
global.testUtils = {
  // Create a mock user
  createMockUser: (overrides) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Create a mock course
  createMockCourse: (overrides) => ({
    id: 'test-course-id',
    title: 'Test Course',
    description: 'Test course description',
    instructor_id: 'test-instructor-id',
    category_id: 'test-category-id',
    level: 'beginner',
    duration_weeks: 8,
    price: 99.99,
    currency: 'USD',
    is_published: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Create a mock forum post
  createMockPost: (overrides) => ({
    id: 'test-post-id',
    title: 'Test Post',
    content: 'Test post content',
    author_id: 'test-user-id',
    category_id: 'test-category-id',
    view_count: 0,
    like_count: 0,
    reply_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  // Wait for next tick
  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    status,
    data,
    success: true,
    message: 'Success',
  }),

  // Mock API error
  mockApiError: (message, status = 500) => ({
    status,
    success: false,
    error: {
      message,
      code: 'ERROR_CODE',
    },
  }),
};

// Console error suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
