export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testTimeout: 10000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
};
