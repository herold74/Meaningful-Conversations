module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'practice/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**',
    '!routes/gemini/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 50,
      lines: 40,
      statements: 40,
    },
  },
};
