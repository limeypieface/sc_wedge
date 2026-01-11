/**
 * Jest Configuration for Sindri Prototype
 */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        moduleResolution: 'node',
        strict: true,
        skipLibCheck: true,
      },
    }],
  },
  moduleNameMapper: {
    // Map prototype paths
    '^@/components/(.*)$': '<rootDir>/../components/$1',
    '^@/lib/(.*)$': ['<rootDir>/src/lib/$1', '<rootDir>/../lib/$1'],
    '^@/types/enums$': '<rootDir>/src/types/enums/index.ts',
    '^@/types/enums/(.*)$': '<rootDir>/src/types/enums/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
