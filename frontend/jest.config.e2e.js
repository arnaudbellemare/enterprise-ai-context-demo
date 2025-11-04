const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// E2E test configuration with REAL API calls
const customJestConfig = {
  // Use real-api setup for E2E tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup-real-api.js'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },

  // Only run E2E tests
  testMatch: [
    '**/__tests__/**/*.e2e.{js,jsx,ts,tsx}',
    '**/*.e2e.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Verbose output
  verbose: true,

  // Longer timeout for E2E tests with real API calls
  testTimeout: 60000, // 60 seconds

  // Run tests serially for E2E (avoid API rate limits)
  maxWorkers: 1,
}

module.exports = createJestConfig(customJestConfig)
