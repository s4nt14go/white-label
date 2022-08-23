let testRegex = '\\.(ts|tsx)$';
switch (
  process.env.TEST_MODE // eslint-disable-line no-undef
) {
  case 'unit':
    testRegex = '\\.unit' + testRegex;
    break;
  case 'int':
    testRegex = '\\.int' + testRegex;
    break;
  case 'e2e':
    testRegex = '\\.e2e' + testRegex;
    break;

  default:
    throw new Error(`Unknown testRegex: ${testRegex}`);
}

// eslint-disable-next-line no-undef
module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testRegex,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
