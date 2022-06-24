let testRegex = '\\.(ts|tsx)$';
switch (process.env.TEST_MODE) {  // eslint-disable-line no-undef
  case 'unit':
    testRegex = '\\.unit' + testRegex;
    break;
  case 'int':
    testRegex = '\\.int' + testRegex;
    break;

  default:
    throw new Error(`Unknown testRegex: ${testRegex}`);
}

module.exports = {  // eslint-disable-line no-undef
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};