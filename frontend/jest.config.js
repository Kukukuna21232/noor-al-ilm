// ═════════════════════════════════════════════════════════════════════════════
// NOOR AL-ILM JEST CONFIGURATION
// Version: 1.0.0
// Description: Jest testing configuration for frontend
// ═════════════════════════════════════════════════════════════════════════════

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.(ts|tsx|js)',
    '!src/**/index.(ts|tsx|js)',
    '!src/app/globals.css',
    '!src/app/layout.tsx',
    '!src/middleware.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  // Module file extensions for modules that include TypeScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'md'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  // Ignore transforming node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  // Setup files
  setupFiles: ['<rootDir>/jest.polyfills.js'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
