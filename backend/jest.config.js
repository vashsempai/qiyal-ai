/** @type {import('jest').Config} */
const config = {
  // Indicates that the test environment is Node.js
  testEnvironment: 'node',
  // Explicitly tell Jest that we are using ES Modules.
  // This helps Jest understand `import`/`export` syntax.
  transform: {},
  // The bail config option can be used to stop Jest from running further tests
  // after the first test has failed.
  bail: 1,
  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,
};
export default config;
