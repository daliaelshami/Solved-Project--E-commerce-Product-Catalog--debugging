module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: ['controllers/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/']
};