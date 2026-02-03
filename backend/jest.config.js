module.exports = {
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/features/song/services/**/*.js',
    '<rootDir>/features/song/repositories/**/*.js',
    '<rootDir>/controllers/songController.js',
    '<rootDir>/controllers/authController.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 30000
};
