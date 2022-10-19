module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/polyfill/node-crypto.ts'],
}

process.env = {
  AUTH_SECRET: 'secret',
}
