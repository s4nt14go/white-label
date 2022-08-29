/* eslint-disable no-undef */
let testRegex = '\\.(ts|tsx)$';
const options = {};
switch (process.env.TEST_MODE) {
  case 'unit':
    options.testRegex = '\\.unit' + testRegex;
    break;
  case 'int':
    options.testRegex = '\\.int' + testRegex;
    options.testTimeout = 20000;
    break;
  case 'e2e':
    options.testRegex = '\\.e2e' + testRegex;
    options.testTimeout = 15000;
    break;

  default:
    throw new Error(`Unknown TEST_MODE: ${process.env.TEST_MODE}`);
}

module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  ...options,
};
